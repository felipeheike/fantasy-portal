'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Megaphone, AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

type Variant = 'info' | 'warning' | 'critical';

interface GlobalAnnouncement {
  message: string;
  variant: Variant;
  updatedAt: string;
}

interface PlayerNotice {
  id: string;
  message: string;
  variant: Variant;
}

const VARIANT_STYLES: Record<Variant, { icon: typeof Megaphone; classes: string }> = {
  info: { icon: Megaphone, classes: 'bg-portal-primary/10 border-portal-primary/30 text-portal-primary' },
  warning: { icon: AlertTriangle, classes: 'bg-amber-500/10 border-amber-500/30 text-amber-500' },
  critical: { icon: ShieldAlert, classes: 'bg-red-500/10 border-red-500/30 text-red-400' },
};

function BannerRow({ variant, message, onDismiss }: { variant: Variant; message: string; onDismiss: () => void }) {
  const { icon: Icon, classes } = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`w-full max-w-3xl mx-auto flex items-start gap-3 p-4 rounded-2xl border ${classes}`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="flex-1 text-xs font-bold leading-relaxed">{message}</p>
      <button
        onClick={onDismiss}
        className="p-1 hover:bg-black/10 rounded-full transition-colors shrink-0"
        title="Dispensar aviso"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function AnnouncementBanner() {
  const { dismissedAnnouncementAt, dismissAnnouncement } = useGameStore();
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [notices, setNotices] = useState<PlayerNotice[]>([]);

  useEffect(() => {
    fetch('/api/announcement')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAnnouncement(data))
      .catch(() => setAnnouncement(null));

    fetch('/api/notices')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotices(Array.isArray(data) ? data : []))
      .catch(() => setNotices([]));
  }, []);

  const dismissNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    fetch(`/api/notices/${id}/read`, { method: 'POST' }).catch(() => {});
  };

  const showGlobal = announcement && announcement.message && announcement.updatedAt !== dismissedAnnouncementAt;

  if (!showGlobal && notices.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <AnimatePresence>
        {notices.map((notice) => (
          <BannerRow
            key={notice.id}
            variant={notice.variant}
            message={notice.message}
            onDismiss={() => dismissNotice(notice.id)}
          />
        ))}
        {showGlobal && announcement && (
          <BannerRow
            key="global"
            variant={announcement.variant}
            message={announcement.message}
            onDismiss={() => dismissAnnouncement(announcement.updatedAt)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
