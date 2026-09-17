'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Megaphone, AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface Announcement {
  message: string;
  variant: 'info' | 'warning' | 'critical';
  updatedAt: string;
}

const VARIANT_STYLES: Record<Announcement['variant'], { icon: typeof Megaphone; classes: string }> = {
  info: { icon: Megaphone, classes: 'bg-portal-primary/10 border-portal-primary/30 text-portal-primary' },
  warning: { icon: AlertTriangle, classes: 'bg-amber-500/10 border-amber-500/30 text-amber-500' },
  critical: { icon: ShieldAlert, classes: 'bg-red-500/10 border-red-500/30 text-red-400' },
};

export default function AnnouncementBanner() {
  const { dismissedAnnouncementAt, dismissAnnouncement } = useGameStore();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    fetch('/api/announcement')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAnnouncement(data))
      .catch(() => setAnnouncement(null));
  }, []);

  if (!announcement || !announcement.message || announcement.updatedAt === dismissedAnnouncementAt) {
    return null;
  }

  const { icon: Icon, classes } = VARIANT_STYLES[announcement.variant] || VARIANT_STYLES.info;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className={`w-full max-w-3xl mx-auto flex items-start gap-3 p-4 rounded-2xl border ${classes}`}
      >
        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
        <p className="flex-1 text-xs font-bold leading-relaxed">{announcement.message}</p>
        <button
          onClick={() => dismissAnnouncement(announcement.updatedAt)}
          className="p-1 hover:bg-black/10 rounded-full transition-colors shrink-0"
          title="Dispensar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
