// List of themed Spotify playlist URIs for genres and moods
export const SPOTIFY_THEMES: Record<string, Record<string, string>> = {
  fantasy: {
    exploration: 'spotify:playlist:37i9dQZF1DX3yHcsP57vXI', // Medieval Ambient
    combat: 'spotify:playlist:37i9dQZF1DXbS2Jy72rJgZ',      // RPG Battle Music
    mystery: 'spotify:playlist:42Wd70pL4eCgV3aOq0yB6x',     // Mysterious Fantasy
    melancholic: 'spotify:playlist:37i9dQZF1DX8U745H2yv7V', // Sad Classical
    victory: 'spotify:playlist:62K70eN1F8w9bZ2jVA0B3P'      // Orchestral Victory
  },
  cyberpunk: {
    exploration: 'spotify:playlist:37i9dQZF1DXdLTEG48dG0A', // Cyberpunk Synthwave
    combat: 'spotify:playlist:37i9dQZF1DXd29e3D1a2z4',      // Darksynth Action
    mystery: 'spotify:playlist:37i9dQZF1DX1tz7cpe7xee',     // Dark Sci-Fi Ambient
    melancholic: 'spotify:playlist:37i9dQZF1DX4sWSp4akBhW', // Chillwave
    victory: 'spotify:playlist:37i9dQZF1DXbTxe7OHrGOw'      // Electro Victory
  },
  horror: {
    exploration: 'spotify:playlist:37i9dQZF1DXa1rZ556J5H5', // Horror Ambient
    combat: 'spotify:playlist:52Wd70pL4eCgV3aOq0yB6x',      // Action Horror
    mystery: 'spotify:playlist:37i9dQZF1DX6456J5H5Wd7',     // Creepy Ambient
    melancholic: 'spotify:playlist:37i9dQZF1DX0rZ556J5H5p', // Melancholy Dark Piano
    victory: 'spotify:playlist:37i9dQZF1DX56J5H5Wd7ec'      // Safe Room/Relief Ambient
  },
  'sci-fi': {
    exploration: 'spotify:playlist:37i9dQZF1DX56J5H5Wd7ea', // Deep Space Ambient
    combat: 'spotify:playlist:37i9dQZF1DXd29e3D1a2z4',      // Sci-Fi Action Beats
    mystery: 'spotify:playlist:37i9dQZF1DX1tz7cpe7xee',     // Cosmic Mystery
    melancholic: 'spotify:playlist:37i9dQZF1DX4sWSp4akBhW', // Space Melancholy
    victory: 'spotify:playlist:37i9dQZF1DXbTxe7OHrGOw'      // Space Victory
  }
};
