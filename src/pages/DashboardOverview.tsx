import { useDashboardData } from '@/hooks/useDashboardData';
import type { Kontakte } from '@/types/app';
import { LOOKUP_OPTIONS, APP_IDS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { KontakteDialog } from '@/components/dialogs/KontakteDialog';
import {
  RecordOverlay,
  RecordHeader,
  RecordKeyFacts,
  RecordSection,
  RecordField,
  RecordAttachments,
  useRecordOverlayStack,
} from '@/components/widgets/RecordView';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconPlus,
  IconSearch,
  IconPhone,
  IconMail,
  IconWorld,
  IconMapPin,
  IconUsers,
  IconUser,
  IconBriefcase,
  IconHeart,
  IconFriends,
  IconDots,
  IconPencil,
  IconTrash,
  IconAlertCircle,
  IconTool,
  IconRefresh,
  IconCheck,
  IconCake,
  IconNote,
} from '@tabler/icons-react';

const APPGROUP_ID = '6a293e0a641577685f98d4f2';
const REPAIR_ENDPOINT = '/claude/build/repair';

const KATEGORIE_OPTIONS = LOOKUP_OPTIONS['kontakte']?.['kategorie'] ?? [];

const KATEGORIE_COLOR: Record<string, string> = {
  privat: 'bg-blue-100 text-blue-700',
  geschaeftlich: 'bg-amber-100 text-amber-700',
  familie: 'bg-rose-100 text-rose-700',
  freunde: 'bg-green-100 text-green-700',
  sonstiges: 'bg-zinc-100 text-zinc-600',
};

const KATEGORIE_ICON: Record<string, typeof IconUser> = {
  privat: IconUser,
  geschaeftlich: IconBriefcase,
  familie: IconHeart,
  freunde: IconFriends,
  sonstiges: IconDots,
};

function getInitials(k: Kontakte) {
  const v = k.fields.vorname?.charAt(0).toUpperCase() ?? '';
  const n = k.fields.nachname?.charAt(0).toUpperCase() ?? '';
  return (v + n) || '?';
}

function getFullName(k: Kontakte) {
  const parts = [k.fields.vorname, k.fields.nachname].filter(Boolean);
  return parts.length ? parts.join(' ') : '(Kein Name)';
}

function getAddress(k: Kontakte) {
  const street = [k.fields.strasse, k.fields.hausnummer].filter(Boolean).join(' ');
  const city = [k.fields.postleitzahl, k.fields.ort].filter(Boolean).join(' ');
  return [street, city].filter(Boolean).join(', ');
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-rose-500',
    'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return colors[hash % colors.length];
}

export default function DashboardOverview() {
  const { kontakte, loading, error, fetchAll } = useDashboardData();

  const [search, setSearch] = useState('');
  const [filterKat, setFilterKat] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Kontakte | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kontakte | null>(null);

  const overlay = useRecordOverlayStack<Kontakte>();

  const filtered = useMemo(() => {
    let list = kontakte;
    if (filterKat) list = list.filter(k => k.fields.kategorie?.key === filterKat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(k => {
        const name = getFullName(k).toLowerCase();
        const email = (k.fields.email ?? '').toLowerCase();
        const ort = (k.fields.ort ?? '').toLowerCase();
        const notizen = (k.fields.notizen ?? '').toLowerCase();
        return name.includes(q) || email.includes(q) || ort.includes(q) || notizen.includes(q);
      });
    }
    return [...list].sort((a, b) => getFullName(a).localeCompare(getFullName(b), 'de'));
  }, [kontakte, search, filterKat]);

  const grouped = useMemo(() => {
    const groups: Record<string, Kontakte[]> = {};
    for (const k of filtered) {
      const letter = getFullName(k).charAt(0).toUpperCase();
      const key = /[A-Z]/.test(letter) ? letter : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(k);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'de'));
  }, [filtered]);

  const stats = useMemo(() => {
    const total = kontakte.length;
    const geschaeftlich = kontakte.filter(k => k.fields.kategorie?.key === 'geschaeftlich').length;
    const privat = kontakte.filter(k => k.fields.kategorie?.key === 'privat').length;
    const mitNotizen = kontakte.filter(k => k.fields.notizen?.trim()).length;
    return { total, geschaeftlich, privat, mitNotizen };
  }, [kontakte]);

  const handleOpenCreate = useCallback(() => {
    setEditRecord(null);
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((k: Kontakte, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditRecord(k);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteKontakteEntry(deleteTarget.record_id);
    overlay.close();
    setDeleteTarget(null);
    fetchAll();
  }, [deleteTarget, overlay, fetchAll]);

  const overlayContact = overlay.top;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* KPI-Streifen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Kontakte"
          value={String(stats.total)}
          description="Gesamt"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Geschäftlich"
          value={String(stats.geschaeftlich)}
          description="Kategorie"
          icon={<IconBriefcase size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Privat"
          value={String(stats.privat)}
          description="Kategorie"
          icon={<IconUser size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit Notizen"
          value={String(stats.mitNotizen)}
          description="Haben Notizen"
          icon={<IconNote size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Name, E-Mail, Ort, Notizen …"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterKat(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterKat === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Alle
          </button>
          {KATEGORIE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilterKat(filterKat === opt.key ? null : opt.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterKat === opt.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="shrink-0 ml-auto">
          <IconPlus size={16} className="mr-1 shrink-0" />
          <span className="hidden sm:inline">Neuer Kontakt</span>
          <span className="sm:hidden">Neu</span>
        </Button>
      </div>

      {/* Kontaktliste */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <IconUsers size={48} className="text-muted-foreground" stroke={1.5} />
          <p className="font-medium text-foreground">
            {kontakte.length === 0 ? 'Noch keine Kontakte' : 'Keine Treffer'}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {kontakte.length === 0
              ? 'Lege deinen ersten Kontakt an.'
              : 'Passe die Suche oder den Filter an.'}
          </p>
          {kontakte.length === 0 && (
            <Button size="sm" onClick={handleOpenCreate}>
              <IconPlus size={16} className="mr-1" />Kontakt anlegen
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([letter, group]) => (
            <div key={letter}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">{letter}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.map(k => (
                  <ContactCard
                    key={k.record_id}
                    kontakt={k}
                    onClick={() => overlay.replace(k)}
                    onEdit={e => handleOpenEdit(k, e)}
                    onDelete={e => { e.stopPropagation(); setDeleteTarget(k); }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail-Overlay */}
      <RecordOverlay
        open={overlay.open}
        onClose={overlay.close}
        onEdit={overlayContact ? () => handleOpenEdit(overlayContact) : undefined}
        editLabel="Bearbeiten"
        closeLabel="Schließen"
        size="md"
      >
        {overlayContact && (
          <ContactDetail
            kontakt={overlayContact}
            onDelete={() => setDeleteTarget(overlayContact)}
          />
        )}
      </RecordOverlay>

      {/* Erstellen / Bearbeiten */}
      <KontakteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={async fields => {
          if (editRecord) {
            await LivingAppsService.updateKontakteEntry(editRecord.record_id, fields);
          } else {
            await LivingAppsService.createKontakteEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRecord?.fields}
        recordId={editRecord?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Kontakte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kontakte']}
      />

      {/* Löschen bestätigen */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Kontakt löschen"
        description={`Möchtest du „${deleteTarget ? getFullName(deleteTarget) : ''}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Kontaktkarte ────────────────────────────────────────────────────────────

function ContactCard({
  kontakt: k,
  onClick,
  onEdit,
  onDelete,
}: {
  kontakt: Kontakte;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const name = getFullName(k);
  const initials = getInitials(k);
  const avatarColor = getAvatarColor(name);
  const katKey = k.fields.kategorie?.key ?? '';
  const katLabel = k.fields.kategorie?.label;
  const katClass = KATEGORIE_COLOR[katKey] ?? KATEGORIE_COLOR['sonstiges'];
  const KatIcon = KATEGORIE_ICON[katKey] ?? IconDots;

  return (
    <div
      onClick={onClick}
      className="group bg-card border border-border rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-3 overflow-hidden"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{name}</p>
          {katLabel && (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${katClass}`}>
              <KatIcon size={11} />
              {katLabel}
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Bearbeiten"
          >
            <IconPencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Löschen"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground min-w-0">
        {k.fields.email && (
          <div className="flex items-center gap-1.5 min-w-0">
            <IconMail size={12} className="shrink-0" />
            <span className="truncate">{k.fields.email}</span>
          </div>
        )}
        {(k.fields.mobil ?? k.fields.telefon) && (
          <div className="flex items-center gap-1.5 min-w-0">
            <IconPhone size={12} className="shrink-0" />
            <span className="truncate">{k.fields.mobil ?? k.fields.telefon}</span>
          </div>
        )}
        {k.fields.ort && (
          <div className="flex items-center gap-1.5 min-w-0">
            <IconMapPin size={12} className="shrink-0" />
            <span className="truncate">{k.fields.ort}</span>
          </div>
        )}
      </div>

      {k.fields.notizen && (
        <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border pt-2 mt-1">
          {k.fields.notizen}
        </p>
      )}
    </div>
  );
}

// ─── Detailansicht im Overlay ────────────────────────────────────────────────

function ContactDetail({
  kontakt: k,
  onDelete,
}: {
  kontakt: Kontakte;
  onDelete: () => void;
}) {
  const name = getFullName(k);
  const initials = getInitials(k);
  const avatarColor = getAvatarColor(name);
  const katKey = k.fields.kategorie?.key ?? '';
  const katLabel = k.fields.kategorie?.label;
  const katClass = KATEGORIE_COLOR[katKey] ?? KATEGORIE_COLOR['sonstiges'];
  const address = getAddress(k);

  return (
    <>
      <RecordHeader
        title={name}
        subtitle={k.fields.email}
        media={
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 ${avatarColor}`}>
            {initials}
          </div>
        }
        badges={
          katLabel ? (
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${katClass}`}>
              {katLabel}
            </span>
          ) : undefined
        }
        actions={
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-medium"
          >
            <IconTrash size={13} />
            Löschen
          </button>
        }
      />

      <RecordKeyFacts
        items={[
          ...(k.fields.telefon ? [{ label: 'Telefon', value: k.fields.telefon, icon: IconPhone }] : []),
          ...(k.fields.mobil ? [{ label: 'Mobil', value: k.fields.mobil, icon: IconPhone }] : []),
          ...(k.fields.geburtsdatum ? [{ label: 'Geburtstag', value: formatDate(k.fields.geburtsdatum), icon: IconCake }] : []),
        ]}
      />

      <RecordSection title="Kontaktdaten" cols={2}>
        <RecordField label="E-Mail" value={k.fields.email} format="email" hideEmpty />
        <RecordField label="Webseite" value={k.fields.webseite} format="url" hideEmpty />
        <RecordField label="Telefon" value={k.fields.telefon} hideEmpty />
        <RecordField label="Mobil" value={k.fields.mobil} hideEmpty />
      </RecordSection>

      {address && (
        <RecordSection title="Adresse" icon={IconMapPin}>
          <RecordField label="Straße" value={[k.fields.strasse, k.fields.hausnummer].filter(Boolean).join(' ')} hideEmpty />
          <RecordField label="Ort" value={[k.fields.postleitzahl, k.fields.ort].filter(Boolean).join(' ')} hideEmpty />
        </RecordSection>
      )}

      <RecordSection title="Weitere Infos">
        <RecordField label="Geburtsdatum" value={k.fields.geburtsdatum} format="date" hideEmpty />
        <RecordField label="Kategorie" value={katLabel} hideEmpty />
      </RecordSection>

      {k.fields.notizen && (
        <RecordSection title="Notizen" icon={IconNote}>
          <RecordField label="" value={k.fields.notizen} format="longtext" />
        </RecordSection>
      )}

      <RecordAttachments appId={APP_IDS.KONTAKTE} recordId={k.record_id} />
    </>
  );
}

// ─── Skeleton & Error ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) { setRepairing(false); setRepairFailed(true); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte lade die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen.</p>}
    </div>
  );
}
