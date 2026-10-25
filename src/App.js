import "./App.css";
import "./Design.css";
import "./Mobile.css";
import "leaflet/dist/leaflet.css";
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessionProvider, useSession } from "./composants/Session";
import Bienvenue from "./Accueil/Bienvenue";
import Accueil from "./Accueil/Accueil";
import Inscription from "./Authentification/Inscription/Inscription";
import FinaliserInscription from "./Authentification/Inscription/FinaliserInscription";
import ReussiteInscription from "./Authentification/Inscription/ReussiteInscription";
import Connexion from "./Authentification/Connexion/Connexion";
import Profil from "./Profil/Profil";
import ModifierProfil from "./Profil/ModifierProfil";
import Proche from "./Profil/Proche";
import MonAnnonce from "./Annonce/MonAnnonce";
import Recherche from "./Recherche/Recherche";
import ProfilJeune from "./Recherche/ProfilJeune";
import NouvelleDemande from "./Demandes/NouvelleDemande";
import DemandeEnvoyee from "./Demandes/DemandeEnvoyee";
import MesServices from "./Demandes/MesServices";
import DetailDemande from "./Demandes/DetailDemande";
import Messages from "./Messages/Messages";
import Conversation from "./Messages/Conversation";
import Fil from "./Fil/Fil";
import Charte from "./Profil/Charte";
import ChangerRole from "./Profil/ChangerRole";

const Protege = ({ children }) => {
    const { chargement, uid, utilisateur } = useSession();
    if (chargement) return <div className="ecran vdo" id="vdo"><p className="chargement">Chargement…</p></div>;
    if (!uid || !utilisateur) return <Navigate to="/connexion" replace />;
    return children;
};

const Racine = () => {
    const { chargement, utilisateur } = useSession();
    if (chargement) return <div className="ecran vdo" id="vdo"><p className="chargement">Chargement…</p></div>;
    return <Navigate to={utilisateur ? "/accueil" : "/bienvenue"} replace />;
};

const p = (element) => <Protege>{element}</Protege>;

function App() {
    return (
        <div className="App">
            <SessionProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Racine />} />
                        <Route path="/bienvenue" element={<Bienvenue />} />
                        <Route path="/inscription" element={<Inscription />} />
                        <Route path="/finaliser-inscription" element={<FinaliserInscription />} />
                        <Route path="/reussite-inscription" element={<ReussiteInscription />} />
                        <Route path="/connexion" element={<Connexion />} />
                        <Route path="/accueil" element={p(<Accueil />)} />
                        <Route path="/profil" element={p(<Profil />)} />
                        <Route path="/modifier-profil" element={p(<ModifierProfil />)} />
                        <Route path="/proche" element={p(<Proche />)} />
                        <Route path="/changer-role" element={p(<ChangerRole />)} />
                        <Route path="/annonce" element={p(<MonAnnonce />)} />
                        <Route path="/recherche" element={p(<Recherche />)} />
                        <Route path="/jeunes/:id" element={p(<ProfilJeune />)} />
                        <Route path="/jeunes/:id/demande" element={p(<NouvelleDemande />)} />
                        <Route path="/demande-envoyee/:id" element={p(<DemandeEnvoyee />)} />
                        <Route path="/services" element={p(<MesServices />)} />
                        <Route path="/demandes/:id" element={p(<DetailDemande />)} />
                        <Route path="/messages" element={p(<Messages />)} />
                        <Route path="/messages/:id" element={p(<Conversation />)} />
                        <Route path="/fil" element={p(<Fil />)} />
                        <Route path="/charte" element={<Charte />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </SessionProvider>
        </div>
    );
}

export default App;
