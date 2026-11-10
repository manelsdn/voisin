import { useEffect, useRef } from "react";
import L from "leaflet";
import { nomService, texteDistance } from "../services/constantes";
import { svgAvatar } from "../composants/Mise";

const echapper = (t) => String(t || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const positionFloue = (personne) => {
    const graine = [...String(personne.id || "")].reduce((t, c) => (t * 31 + c.charCodeAt(0)) % 100003, 7);
    const angle = (graine % 360) * Math.PI / 180;
    const rayon = 60 + (graine % 90);
    const dLat = (rayon * Math.cos(angle)) / 111320;
    const dLon = (rayon * Math.sin(angle)) / (111320 * Math.cos(personne.latitude * Math.PI / 180));
    return [personne.latitude + dLat, personne.longitude + dLon];
};

const LIEN = (j) => `/jeunes/${j.id}`;
const TITRE = (j) => j.prenom;
const DETAIL = (j) => `${texteDistance(j.distance)} · ${(j.services || []).map(nomService).join(", ")}`;
const IMAGE = (j) => j.photoProfil;

const CarteJeunes = ({ centre, jeunes, rayon, ouvrir, lienVers = LIEN, titre = TITRE, detail = DETAIL, image = IMAGE, bouton = "Voir son profil", region = "Carte des jeunes disponibles" }) => {
    const zone = useRef(null);
    const carte = useRef(null);
    const couche = useRef(null);
    const cadre = useRef(null);

    useEffect(() => {
        if (!zone.current || !centre || centre.latitude == null) return undefined;
        const c = L.map(zone.current, { zoomControl: true, attributionControl: true }).setView([centre.latitude, centre.longitude], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: "© OpenStreetMap"
        }).addTo(c);
        carte.current = c;
        couche.current = L.layerGroup().addTo(c);
        const suivi = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
            c.invalidateSize();
            if (cadre.current) c.fitBounds(cadre.current, { padding: [30, 30], maxZoom: 16 });
        });
        if (suivi) suivi.observe(zone.current);
        return () => {
            if (suivi) suivi.disconnect();
            c.remove();
            carte.current = null;
        };
    }, [centre]);

    useEffect(() => {
        const c = carte.current;
        if (!c || !couche.current) return;
        couche.current.clearLayers();
        const moi = [centre.latitude, centre.longitude];
        L.circle(moi, { radius: rayon * 1000, color: "#FFC145", weight: 2, fillColor: "#FFC145", fillOpacity: 0.08 }).addTo(couche.current);
        L.marker(moi, { icon: L.divIcon({ className: "", html: '<span class="pin-moi"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }), title: "Vous" }).addTo(couche.current);
        const points = [moi];
        jeunes.forEach((j) => {
            if (j.latitude == null) return;
            const p = positionFloue(j);
            points.push(p);
            const img = image(j);
            const contenu = img ? `<img src="${echapper(img)}" alt="">` : svgAvatar(j);
            const marqueur = L.marker(p, { icon: L.divIcon({ className: "", html: `<span class="pin-jeune">${contenu}</span>`, iconSize: [38, 38], iconAnchor: [19, 19] }), title: titre(j) });
            const bulle = document.createElement("div");
            bulle.className = "bulle-carte";
            bulle.innerHTML = `<strong>${echapper(titre(j))}</strong><small>${echapper(detail(j))}</small>`;
            const ancre = document.createElement("a");
            ancre.href = lienVers(j);
            ancre.textContent = bouton;
            ancre.addEventListener("click", (e) => {
                e.preventDefault();
                ouvrir(lienVers(j));
            });
            bulle.appendChild(ancre);
            marqueur.bindPopup(bulle).addTo(couche.current);
        });
        c.invalidateSize();
        cadre.current = points.length > 1 ? L.latLngBounds(points) : null;
        if (cadre.current) c.fitBounds(cadre.current, { padding: [30, 30], maxZoom: 16 });
        else c.setView(moi, 14);
    }, [centre, jeunes, rayon, ouvrir, lienVers, titre, detail, image, bouton]);

    return <div className="carte-leaflet" ref={zone} role="region" aria-label={region}></div>;
};

export default CarteJeunes;
