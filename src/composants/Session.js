import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ecouterSession, lireUtilisateur } from "../services/api";

const SessionContexte = createContext(null);
const CLE = "vdo-moi";

const memoire = (id) => {
    try {
        const u = JSON.parse(localStorage.getItem(CLE) || "null");
        return u && u.id === id ? u : null;
    } catch (e) {
        return null;
    }
};

const garder = (u) => {
    try {
        if (u) localStorage.setItem(CLE, JSON.stringify(u));
        else localStorage.removeItem(CLE);
    } catch (e) {
        return;
    }
};

export const SessionProvider = ({ children }) => {
    const [uid, setUid] = useState(undefined);
    const [utilisateur, setUtilisateur] = useState(null);
    const version = useRef(0);
    const relancer = useRef(null);

    const charger = useCallback(async (id) => {
        const v = ++version.current;
        const enCache = id ? memoire(id) : null;
        if (enCache) {
            setUtilisateur(enCache);
            setUid(id);
        }
        let u = null;
        try {
            u = id ? await lireUtilisateur(id) : null;
        } catch (e) {
            if (v !== version.current) return enCache;
            if (enCache) return enCache;
            setTimeout(() => v === version.current && relancer.current(id), 3000);
            return null;
        }
        if (v !== version.current) return u;
        garder(u);
        setUtilisateur(u);
        setUid(id || null);
        return u;
    }, []);

    relancer.current = charger;

    useEffect(() => ecouterSession((id) => { charger(id); }), [charger]);

    const recharger = useCallback((id) => charger(id || uid), [charger, uid]);

    return (
        <SessionContexte.Provider value={{ uid, utilisateur, chargement: uid === undefined, recharger }}>
            {children}
        </SessionContexte.Provider>
    );
};

export const useSession = () => useContext(SessionContexte);
