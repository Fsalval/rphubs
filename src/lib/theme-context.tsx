// src/lib/theme-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'midnight' | 'forest' | 'ocean' | 'sunset';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: Array<{
    id: Theme;
    name: string;
    description: string;
    isPremium: boolean;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes = [
  {
    id: 'light' as Theme,
    name: 'Claro',
    description: 'Tema clásico claro',
    isPremium: false,
    colors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      accent: '#007bff'
    }
  },
  {
    id: 'dark' as Theme,
    name: 'Oscuro',
    description: 'Tema clásico oscuro',
    isPremium: false,
    colors: {
      primary: '#1a1a1a',
      secondary: '#2d2d2d',
      accent: '#4a9eff'
    }
  },
  {
    id: 'midnight' as Theme,
    name: 'Medianoche',
    description: 'Elegante tema azul oscuro',
    isPremium: true,
    colors: {
      primary: '#0f1419',
      secondary: '#1a2332',
      accent: '#64b5f6'
    }
  },
  {
    id: 'forest' as Theme,
    name: 'Bosque',
    description: 'Tema natural verde',
    isPremium: true,
    colors: {
      primary: '#1b2f1b',
      secondary: '#2d5a2d',
      accent: '#66bb6a'
    }
  },
  {
    id: 'ocean' as Theme,
    name: 'Océano',
    description: 'Tema azul profundo',
    isPremium: true,
    colors: {
      primary: '#0d1b2a',
      secondary: '#1b2951',
      accent: '#26a69a'
    }
  },
  {
    id: 'sunset' as Theme,
    name: 'Atardecer',
    description: 'Tema cálido naranja y rosa',
    isPremium: true,
    colors: {
      primary: '#2d1b1b',
      secondary: '#4a2c2a',
      accent: '#ff7043'
    }
  }
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [unlockedThemes, setUnlockedThemes] = useState<Theme[]>(['light', 'dark']);

  useEffect(() => {
    // Verificar si hay un tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && themes.find(t => t.id === savedTheme)) {
      setTheme(savedTheme);
    } else {
      // Verificar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Cargar temas desbloqueados (simulado - en producción vendría de la base de datos)
    const savedUnlockedThemes = localStorage.getItem('rphubs-unlocked-themes');
    if (savedUnlockedThemes) {
      setUnlockedThemes(JSON.parse(savedUnlockedThemes));
    }
  }, []);

  useEffect(() => {
    // Aplicar el tema al documento
    const root = document.documentElement;
    const currentTheme = themes.find(t => t.id === theme);
    
    if (currentTheme) {
      // Remover todas las clases de tema existentes
      themes.forEach(t => root.classList.remove(`theme-${t.id}`, t.id));
      
      // Aplicar la nueva clase de tema
      root.classList.add(theme);
      
      // Para compatibilidad con Tailwind dark mode
      if (theme === 'dark' || ['midnight', 'forest', 'ocean', 'sunset'].includes(theme)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Aplicar variables CSS personalizadas
      root.style.setProperty('--theme-primary', currentTheme.colors.primary);
      root.style.setProperty('--theme-secondary', currentTheme.colors.secondary);
      root.style.setProperty('--theme-accent', currentTheme.colors.accent);
    }
    
    // Guardar en localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    // Verificar si el tema está desbloqueado
    const themeData = themes.find(t => t.id === newTheme);
    if (themeData && (themeData.isPremium && !unlockedThemes.includes(newTheme))) {
      // Tema premium no desbloqueado - redirigir a tienda o mostrar modal
      console.warn('Tema premium no desbloqueado:', newTheme);
      return;
    }
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const availableThemes = themes.filter(t => 
    !t.isPremium || unlockedThemes.includes(t.id)
  );

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme: handleSetTheme, 
      toggleTheme, 
      availableThemes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
