'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Music, 
  ChevronLeft, 
  ChevronRight, 
  Settings2,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Repeat,
  Shuffle
} from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

interface SpotifyPlayerWidgetProps {
  isSpotifyConnected: boolean;
  isOpen: boolean;
  onClose: () => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

export default function SpotifyPlayerWidget({ 
  isSpotifyConnected, 
  isOpen, 
  onClose,
  onPlaybackStateChange 
}: SpotifyPlayerWidgetProps) {
  const { currentScene, settings } = useGameStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playInBrowser, setPlayInBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track info
  const [trackName, setTrackName] = useState('Nenhuma faixa tocando');
  const [artistName, setArtistName] = useState('Conecte seu tocador');
  const [albumArt, setAlbumArt] = useState('');
  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolume] = useState(50);
  
  // Repeat & Mute state
  const [repeatMode, setRepeatMode] = useState<'off' | 'context' | 'track'>('off');
  const [shuffleMode, setShuffleMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [preMuteVolume, setPreMuteVolume] = useState(50);
  
  const [activeDeviceName, setActiveDeviceName] = useState('');
  const [activeDeviceId, setActiveDeviceId] = useState('');

  // Browser SDK state
  const [sdkReady, setSdkReady] = useState(false);
  const [browserDeviceId, setBrowserDeviceId] = useState<string | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  
  const playerInstanceRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Lift state changes up to parent
  useEffect(() => {
    if (onPlaybackStateChange) {
      onPlaybackStateChange(isPlaying);
    }
  }, [isPlaying, onPlaybackStateChange]);

  // Sync isPlaying progress bar
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    if (isPlaying && durationMs > 0) {
      progressIntervalRef.current = setInterval(() => {
        setProgressMs(prev => {
          if (prev >= durationMs) {
            clearInterval(progressIntervalRef.current!);
            return durationMs;
          }
          return prev + 1000;
        });
      }, 1000);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, durationMs]);

  // Load state and state polling (when NOT using Web Playback SDK, or as a general sync)
  const fetchPlaybackState = async () => {
    if (!isSpotifyConnected) return;
    try {
      const res = await fetch('/api/audio/spotify/control');
      if (res.ok) {
        const data = await res.json();
        if (data.active) {
          setIsPlaying(data.isPlaying);
          setProgressMs(data.progressMs || 0);
          
          const currentVol = data.volumePercent || 50;
          setVolume(currentVol);
          setIsMuted(currentVol === 0);
          
          setRepeatMode(data.repeatState || 'off');
          setShuffleMode(data.shuffleState || false);
          setActiveDeviceName(data.deviceName || '');
          setActiveDeviceId(data.deviceId || '');
          
          if (data.item) {
            setTrackName(data.item.name);
            setArtistName(data.item.artists);
            setAlbumArt(data.item.albumArt);
            setDurationMs(data.item.durationMs || 0);
          }
        } else {
          // Connected but no active device
          setActiveDeviceName('');
          setActiveDeviceId('');
          if (!playInBrowser) {
            setIsPlaying(false);
            setTrackName('Aguardando dispositivo ativo');
            setArtistName('Abra o Spotify e dê play para iniciar');
            setAlbumArt('');
            setDurationMs(0);
            setProgressMs(0);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch Spotify playback state:", err);
    }
  };

  // Poll external player state periodically when not in browser mode
  useEffect(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    if (isSpotifyConnected && !playInBrowser) {
      fetchPlaybackState();
      pollingIntervalRef.current = setInterval(fetchPlaybackState, 5000);
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [isSpotifyConnected, playInBrowser]);

  // Handle Spotify Web Playback SDK logic
  useEffect(() => {
    if (!isSpotifyConnected || !playInBrowser) {
      // Clean up SDK Player if playInBrowser is turned off
      if (playerInstanceRef.current) {
        console.log("LOG: Disconnecting Spotify Web SDK Player");
        playerInstanceRef.current.disconnect();
        playerInstanceRef.current = null;
        setBrowserDeviceId(null);
      }
      return;
    }

    setIsLoading(true);
    setSdkError(null);

    // Function to initialize the SDK
    const initSDK = () => {
      if (!window.Spotify) return;

      console.log("LOG: Initializing Spotify Web SDK Player...");
      const player = new window.Spotify.Player({
        name: 'Portal da Fantasia (Navegador)',
        getOAuthToken: async (cb: (token: string) => void) => {
          try {
            const res = await fetch('/api/audio/spotify/token');
            const data = await res.json();
            if (data.accessToken) {
              cb(data.accessToken);
            } else {
              setSdkError("Autenticação expirada. Reconecte o Spotify.");
              cb('');
            }
          } catch (e) {
            setSdkError("Erro ao buscar credenciais do Spotify.");
            cb('');
          }
        },
        volume: volume / 100
      });

      playerInstanceRef.current = player;

      // Event listeners
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('LOG: Spotify Web SDK Player pronto com ID:', device_id);
        setBrowserDeviceId(device_id);
        setIsLoading(false);
        setSdkError(null);
        setActiveDeviceName('Aba do Navegador');
        setActiveDeviceId(device_id);
        
        // Auto-transfer playback to this browser tab
        transferPlayback(device_id);
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('LOG: Spotify Web SDK Player desconectado:', device_id);
        setBrowserDeviceId(null);
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Spotify SDK initialization error:', message);
        setSdkError("Erro ao inicializar o player no navegador.");
        setIsLoading(false);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Spotify SDK auth error:', message);
        setSdkError("Sua sessão do Spotify expirou. Por favor, conecte novamente.");
        setIsLoading(false);
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Spotify SDK account error:', message);
        setSdkError("O player integrado no navegador requer Spotify Premium.");
        setIsLoading(false);
      });

      player.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Spotify SDK playback error:', message);
        toast.error("Erro na reprodução direta: " + message);
      });

      // Playback status updates
      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setProgressMs(state.position);
        setDurationMs(state.duration);
        
        // Sync repeat mode: state.repeat_mode is 0 (off), 1 (context), 2 (track)
        const modes: ('off' | 'context' | 'track')[] = ['off', 'context', 'track'];
        setRepeatMode(modes[state.repeat_mode] || 'off');
        
        // Sync shuffle mode
        setShuffleMode(state.shuffle || false);
        
        const currentTrack = state.track_window?.current_track;
        if (currentTrack) {
          setTrackName(currentTrack.name);
          setArtistName(currentTrack.artists.map((a: any) => a.name).join(', '));
          setAlbumArt(currentTrack.album?.images?.[0]?.url || '');
        }
      });

      player.connect().then((success: boolean) => {
        if (!success) {
          setSdkError("Falha na conexão do player integrado.");
          setIsLoading(false);
        }
      });
    };

    // Load SDK script if not loaded
    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        setSdkReady(true);
        initSDK();
      };
    } else {
      initSDK();
    }

    return () => {
      // Component unmount cleanups are handled by the main check above.
    };
  }, [isSpotifyConnected, playInBrowser]);

  const transferPlayback = async (deviceId: string) => {
    try {
      const res = await fetch('/api/audio/spotify/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'play', deviceId })
      });
      if (res.ok) {
        toast.success("Áudio direcionado para a aba do jogo!");
        fetchPlaybackState();
      } else {
        const errData = await res.json();
        console.warn("Could not transfer playback:", errData.error);
      }
    } catch (err) {
      console.warn("Playback transfer error:", err);
    }
  };

  // Trigger control actions (Play/Pause/Next/Previous/Volume)
  const handleControlAction = async (action: 'play' | 'pause' | 'next' | 'previous', val?: number) => {
    if (!isSpotifyConnected) return;

    // Use local SDK controls directly if in browser mode and active
    if (playInBrowser && playerInstanceRef.current && browserDeviceId) {
      if (action === 'play') playerInstanceRef.current.resume();
      else if (action === 'pause') playerInstanceRef.current.pause();
      else if (action === 'next') playerInstanceRef.current.nextTrack();
      else if (action === 'previous') playerInstanceRef.current.previousTrack();
      return;
    }

    // Otherwise route through Spotify API via our backend
    try {
      const res = await fetch('/api/audio/spotify/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          volume: val, 
          deviceId: playInBrowser ? browserDeviceId : undefined 
        })
      });

      if (res.ok) {
        if (action === 'play') setIsPlaying(true);
        if (action === 'pause') setIsPlaying(false);
        // Delay fetch state slightly to let Spotify register the change
        setTimeout(fetchPlaybackState, 800);
      } else {
        const errData = await res.json();
        if (errData.code === 'NO_ACTIVE_DEVICE') {
          toast.warning("Abra seu aplicativo do Spotify e aperte play para ativar.");
        } else {
          toast.error(errData.error || "Erro ao controlar reprodução.");
        }
      }
    } catch (e) {
      toast.error("Erro de conexão com o controle do player.");
    }
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(e.target.value);
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);

    if (playInBrowser && playerInstanceRef.current) {
      playerInstanceRef.current.setVolume(nextVolume / 100);
    } else {
      try {
        await fetch('/api/audio/spotify/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'volume', volume: nextVolume })
        });
      } catch (_) {}
    }
  };

  const handleToggleRepeat = async () => {
    if (!isSpotifyConnected) return;

    let nextMode: 'off' | 'context' | 'track' = 'off';
    if (repeatMode === 'off') nextMode = 'context';
    else if (repeatMode === 'context') nextMode = 'track';
    else nextMode = 'off';

    setRepeatMode(nextMode);

    try {
      const res = await fetch('/api/audio/spotify/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'repeat', 
          state: nextMode,
          deviceId: playInBrowser ? browserDeviceId : undefined 
        })
      });
      if (!res.ok) {
        setRepeatMode(repeatMode); // Rollback on error
      }
    } catch (_) {
      setRepeatMode(repeatMode);
    }
  };

  const handleToggleShuffle = async () => {
    if (!isSpotifyConnected) return;

    const nextShuffle = !shuffleMode;
    setShuffleMode(nextShuffle);

    try {
      const res = await fetch('/api/audio/spotify/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'shuffle', 
          state: nextShuffle,
          deviceId: playInBrowser ? browserDeviceId : undefined 
        })
      });
      if (!res.ok) {
        setShuffleMode(shuffleMode); // Rollback on error
      }
    } catch (_) {
      setShuffleMode(shuffleMode);
    }
  };

  const handleToggleMute = async () => {
    if (!isSpotifyConnected) return;

    if (isMuted) {
      // Unmute: restore previous volume
      const restoreVol = preMuteVolume > 0 ? preMuteVolume : 50;
      setVolume(restoreVol);
      setIsMuted(false);

      if (playInBrowser && playerInstanceRef.current) {
        playerInstanceRef.current.setVolume(restoreVol / 100);
      } else {
        try {
          await fetch('/api/audio/spotify/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'volume', volume: restoreVol })
          });
        } catch (_) {}
      }
    } else {
      // Mute: save current volume and set to 0
      setPreMuteVolume(volume > 0 ? volume : 50);
      setVolume(0);
      setIsMuted(true);

      if (playInBrowser && playerInstanceRef.current) {
        playerInstanceRef.current.setVolume(0);
      } else {
        try {
          await fetch('/api/audio/spotify/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'volume', volume: 0 })
          });
        } catch (_) {}
      }
    }
  };

  if (!isSpotifyConnected) return null;

  // Format progression times (mm:ss)
  const formatTime = (ms: number) => {
    if (isNaN(ms) || ms <= 0) return '0:00';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;

  return (
    <div className="fixed left-0 bottom-28 z-[45] flex items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-110%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-110%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 ml-4 p-5 rounded-3xl bg-portal-bg/75 border border-portal-border/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4 text-portal-text select-none font-ui"
          >
            {/* Widget Header */}
            <div className="flex items-center justify-between border-b border-portal-border/30 pb-3">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-portal-text-muted">Sinfonia Adaptativa</span>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-portal-surface-hover rounded-lg transition-colors text-portal-text-muted hover:text-portal-text"
                title="Minimizar Player"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* SDK Error Banner */}
            {sdkError && (
              <div className="flex gap-2 items-start p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-[9px] leading-normal uppercase font-black">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span>{sdkError}</span>
              </div>
            )}

            {/* Track Info */}
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 rounded-2xl bg-portal-surface border border-portal-border/40 overflow-hidden flex items-center justify-center relative shrink-0 shadow-md">
                {albumArt ? (
                  <img src={albumArt} alt="Capa Album" className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`} />
                ) : (
                  <Music className="w-6 h-6 text-portal-text-muted" />
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="flex gap-0.5 justify-center items-end h-4">
                      <span className="w-0.5 bg-primary rounded-full animate-[bounce_1.2s_infinite_100ms] h-3"></span>
                      <span className="w-0.5 bg-primary rounded-full animate-[bounce_1.2s_infinite_300ms] h-4"></span>
                      <span className="w-0.5 bg-primary rounded-full animate-[bounce_1.2s_infinite_200ms] h-2"></span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate" title={trackName}>{trackName}</p>
                <p className="text-[10px] text-portal-text-muted truncate mt-0.5" title={artistName}>{artistName}</p>
                {activeDeviceName && (
                  <div className="flex items-center gap-1 mt-1 text-[8px] font-black uppercase text-primary/80">
                    <Tv className="w-2.5 h-2.5" />
                    <span>{activeDeviceName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-1">
              <div className="w-full h-1 bg-portal-surface rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-primary shadow-[0_0_8px_rgba(29,185,84,0.6)] transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono font-bold text-portal-text-muted">
                <span>{formatTime(progressMs)}</span>
                <span>{formatTime(durationMs)}</span>
              </div>
            </div>

            {/* Media Controls */}
            <div className="flex items-center justify-center gap-4">
              {/* Repeat Button */}
              <button 
                onClick={handleToggleRepeat}
                className={`p-2 hover:bg-portal-surface-hover rounded-full transition-colors active:scale-90 relative ${
                  repeatMode !== 'off' ? 'text-primary' : 'text-portal-text-muted hover:text-portal-text'
                }`}
                title={`Repetir: ${repeatMode === 'off' ? 'Desativado' : repeatMode === 'track' ? 'Faixa' : 'Playlist'}`}
              >
                <Repeat className="w-3.5 h-3.5" />
                {repeatMode === 'track' && (
                  <span className="absolute top-1 right-1 text-[6px] font-black bg-primary text-black rounded-full px-0.5 scale-75">1</span>
                )}
              </button>

              <button 
                onClick={() => handleControlAction('previous')}
                className="p-2 hover:bg-portal-surface-hover rounded-full transition-colors text-portal-text-muted hover:text-portal-text active:scale-90"
                title="Anterior"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>
              <button 
                onClick={() => handleControlAction(isPlaying ? 'pause' : 'play')}
                className="p-3.5 bg-primary hover:bg-primary/95 text-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                title={isPlaying ? "Pausar" : "Tocar"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button 
                onClick={() => handleControlAction('next')}
                className="p-2 hover:bg-portal-surface-hover rounded-full transition-colors text-portal-text-muted hover:text-portal-text active:scale-90"
                title="Próximo"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              {/* Shuffle Button */}
              <button 
                onClick={handleToggleShuffle}
                className={`p-2 hover:bg-portal-surface-hover rounded-full transition-colors active:scale-90 ${
                  shuffleMode ? 'text-primary' : 'text-portal-text-muted hover:text-portal-text'
                }`}
                title={`Aleatório: ${shuffleMode ? 'Ativado' : 'Desativado'}`}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Volume & Tab Playback Toggle */}
            <div className="flex flex-col gap-3 pt-2 border-t border-portal-border/30">
              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleToggleMute}
                  className="p-1 hover:bg-portal-surface-hover rounded-lg transition-colors text-portal-text-muted hover:text-portal-text"
                  title={isMuted ? "Reativar Áudio" : "Mutar Áudio"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-portal-surface rounded-full appearance-none cursor-pointer accent-primary" 
                />
              </div>

              {/* Tocar no Navegador Toggle */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-portal-surface/30 hover:bg-portal-surface-hover/50 cursor-pointer border border-portal-border/20 transition-all">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-portal-text">Tocar neste Navegador</span>
                  <span className="text-[8px] text-portal-text-muted uppercase font-black">Emite o áudio por esta aba</span>
                </div>
                <div className="relative flex items-center">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <input 
                      type="checkbox" 
                      checked={playInBrowser}
                      onChange={(e) => setPlayInBrowser(e.target.checked)}
                      className="sr-only peer"
                    />
                  )}
                  <div className="w-7 h-4 bg-portal-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-portal-text-muted peer-checked:after:bg-black after:border-portal-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary transition-all"></div>
                </div>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
