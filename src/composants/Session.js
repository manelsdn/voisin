import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ecouterSession, lireUtilisateur } from "../services/api";

const SessionContexte = createContext(null);

export const SessionProvider = ({ children }) => {
    const [uid, setUid] = useState(undefined);
    const [utilisateur, setUtilisateur] = useState(null);
    const version = useRef(0);

    const charger = useCallback(async (id) => {
        const v = ++version.current;
        const u = id ? await lireUtilisateur(id) : null;
        if (v !== version.current) return u;
        setUtilisateur(u);
        setUid(id || null);
        return u;
    }, []);

    useEffect(() => ecouterSession((id) => { charger(id); }), [charger]);

    const recharger = useCallback((id) => charger(id || uid), [charger, uid]);

    return (
        <SessionContexte.Provider value={{ uid, utilisateur, chargement: uid === undefined, recharger }}>
            {children}
        </SessionContexte.Provider>
    );
};

export const useSession = () => useContext(SessionContexte);
