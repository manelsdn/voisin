import { useEffect, useRef } from "react";
import L from "leaflet";
import { nomService, texteDistance } from "../services/constantes";

const echapper = (t) => String(t || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const positionFloue = (personne) => {
    const graine = [...String(personne.id || "")].reduce((t, c) => (t * 31 + c.charCodeAt(0)) % 100003, 7);
    const angle = (graine % 360) * Math.PI / 180;
    const rayon = 60 + (graine % 90);
    const dLat = (rayon * Math.cos(angle)) / 111320;
    const dLon = (rayon * Math.sin(angle)) / (111320 * Math.cos(personne.latitude * Math.PI / 180));
    return [personne.latitude + dLat, personne.longitude + dLon];
};

const CarteJeunes = ({ centre, jeunes, rayon, ouvrir }) => {
    const zone = useRef(null);
    const carte = useRef(null);
    const couche = useRef(null);

    useEffect(() => {
        if (!zone.current || !centre || centre.latitude == null) return undefined;
        const c = L.map(zone.current, { zoomControl: true, attributionControl: true }).setView([centre.latitude, centre.longitude], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: "© OpenStreetMap"
        }).addTo(c);
        carte.current = c;
        couche.current = L.layerGroup().addTo(c);
        return () => {
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
            const contenu = j.photoProfil ? `<img src="${echapper(j.photoProfil)}" alt="">` : echapper((j.prenom || "?")[0]);
            const marqueur = L.marker(p, { icon: L.divIcon({ className: "", html: `<span class="pin-jeune">${contenu}</span>`, iconSize: [38, 38], iconAnchor: [19, 19] }), title: j.prenom });
            const bulle = document.createElement("div");
            bulle.className = "bulle-carte";
            bulle.innerHTML = `<strong>${echapper(j.prenom)}</strong><small>${echapper(texteDistance(j.distance))} · ${echapper((j.services || []).map(nomService).join(", "))}</small>`;
            const lien = document.createElement("a");
            lien.href = `/jeunes/${j.id}`;
            lien.textContent = "Voir son profil";
            lien.addEventListener("click", (e) => {
                e.preventDefault();
                ouvrir(j.id);
            });
            bulle.appendChild(lien);
            marqueur.bindPopup(bulle).addTo(couche.current);
        });
        if (points.length > 1) c.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 16 });
        else c.setView(moi, 14);
    }, [centre, jeunes, rayon, ouvrir]);

    return <div className="carte-leaflet" ref={zone} role="region" aria-label="Carte des jeunes disponibles"></div>;
};

export default CarteJeunes;
