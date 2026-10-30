import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Scenario } from '../types';

interface ScenarioContextType {
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;
  toggleScenario: () => void;
  isBuggy: boolean;
  registerCartResetHandler: (handler: () => void) => void;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

const STORAGE_KEY = 'synapsee_cafe_scenario';

function getInitialScenario(): Scenario {
  if (typeof window === 'undefined') {
    return 'fixed';
  }

  try {
    // 1. Check URL query params first: /?scenario=buggy or /?scenario=fixed
    const params = new URLSearchParams(window.location.search);
    const urlScenario = params.get('scenario');

    if (urlScenario !== null) {
      if (urlScenario.toLowerCase() === 'buggy') {
        try {
          sessionStorage.setItem(STORAGE_KEY, 'buggy');
          localStorage.setItem(STORAGE_KEY, 'buggy');
        } catch {
          // ignore storage access issues
        }
        return 'buggy';
      }
      // Unknown or 'fixed' defaults to fixed
      try {
        sessionStorage.setItem(STORAGE_KEY, 'fixed');
        localStorage.setItem(STORAGE_KEY, 'fixed');
      } catch {
        // ignore storage access issues
      }
      return 'fixed';
    }

    // 2. Fallback to sessionStorage/localStorage
    const stored = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (stored === 'buggy') {
      return 'buggy';
    }
  } catch {
    // Default fallback
  }

  return 'fixed';
}

export const ScenarioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scenario, setScenarioState] = useState<Scenario>(getInitialScenario);
  const [cartResetHandler, setCartResetHandler] = useState<(() => void) | null>(null);

  const registerCartResetHandler = useCallback((handler: () => void) => {
    setCartResetHandler(() => handler);
  }, []);

  const setScenario = useCallback(
    (newScenario: Scenario) => {
      const validScenario: Scenario = newScenario === 'buggy' ? 'buggy' : 'fixed';
      setScenarioState((prev) => {
        if (prev !== validScenario) {
          try {
            sessionStorage.setItem(STORAGE_KEY, validScenario);
            localStorage.setItem(STORAGE_KEY, validScenario);
          } catch {
            // ignore
          }

          // Switching scenario clears cart and coupon
          if (cartResetHandler) {
            cartResetHandler();
          }

          // Update URL query param cleanly without reloading
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('scenario', validScenario);
            window.history.replaceState({}, '', url.toString());
          } catch {
            // ignore
          }
        }
        return validScenario;
      });
    },
    [cartResetHandler]
  );

  const toggleScenario = useCallback(() => {
    setScenario(scenario === 'fixed' ? 'buggy' : 'fixed');
  }, [scenario, setScenario]);

  // Keep storage in sync
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, scenario);
      localStorage.setItem(STORAGE_KEY, scenario);
    } catch {
      // ignore
    }
  }, [scenario]);

  return (
    <ScenarioContext.Provider
      value={{
        scenario,
        setScenario,
        toggleScenario,
        isBuggy: scenario === 'buggy',
        registerCartResetHandler,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
};

export function useScenario(): ScenarioContextType {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
}

