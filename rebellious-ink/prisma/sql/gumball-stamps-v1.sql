-- Six original postage-stamp-style designs for the gumball machine (theme "stamp"), owned by the house flash profile. Idempotent.
INSERT INTO "Design" (id, title, "artistId", "imageKey", theme, "colourMode", collection, repeatable, "sortOrder", status, "createdAt", "updatedAt")
SELECT v.id, v.title, a.id, v.key, 'stamp', 'BLACK'::"ColourMode", 'GUMBALL'::"DesignCollection", true, v.sort, 'AVAILABLE'::"DesignStatus", now(), now()
FROM (VALUES
  ('prod00000000000000stamp1', 'Stamp: star', 'flash/stamps/stamp-star.png', 40),
  ('prod00000000000000stamp2', 'Stamp: heart', 'flash/stamps/stamp-heart.png', 41),
  ('prod00000000000000stamp3', 'Stamp: lightning bolt', 'flash/stamps/stamp-bolt.png', 42),
  ('prod00000000000000stamp4', 'Stamp: crescent moon', 'flash/stamps/stamp-moon.png', 43),
  ('prod00000000000000stamp5', 'Stamp: diamond', 'flash/stamps/stamp-diamond.png', 44),
  ('prod00000000000000stamp6', 'Stamp: sun', 'flash/stamps/stamp-sun.png', 45)
) AS v(id, title, key, sort)
JOIN "ArtistProfile" a ON a.slug = 'house-flash'
WHERE NOT EXISTS (SELECT 1 FROM "Design" d WHERE d.id = v.id);
