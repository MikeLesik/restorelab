# Google Business Profile — Sync Guide

## GBP URL
https://g.page/restorelab-santcugat

## Business Information (keep in sync with website)
- **Name:** restoreLab
- **Category:** Auto Detailing Service
- **Phone:** +34 680 265 190
- **Website:** https://restorelab.io
- **Address:** Sant Cugat del Vallès, 08172 Barcelona, Spain
- **Hours:** Mon–Sat 08:00–19:00
- **Service area:** Sant Cugat del Vallès + 25 km radius

## Services (as they should appear in GBP)

### Primary Services
1. **Car Paint Correction** — from €149
2. **Ceramic Coating (2-Year)** — from €649
3. **Ceramic Coating (5-Year Premium)** — from €1 049
4. **PPF + Ceramic Flagship** — from €2 290

### Glass & Acrylic
5. **Windshield Scratch Removal** — from €119
6. **Full Glass Set + Hydrophobic** — from €289
7. **Acrylic / Polycarbonate Restoration** — custom quote

### Extras
8. **Headlight Restoration** — from €79/pair
9. **Interior Leather Restoration** — custom quote
10. **Pre-Sale Detail Pack** — from €249
11. **Wheel Ceramic Coating** — from €189
12. **Engine Bay Detailing** — from €119

## Service Area Polygon
Center: Sant Cugat del Vallès (41.4736, 2.0868)
Radius: ~25 km

### Priority zones (within 20 min):
- Sant Cugat del Vallès, Rubí, Cerdanyola del Vallès, Bellaterra, Valldoreix
- Matadepera, Sant Quirze del Vallès, Castellar del Vallès
- Sabadell, Terrassa

### Extended zones (20–40 min):
- Barcelona (Pedralbes, Sant Gervasi, Sarrià, Eixample)
- Sant Just Desvern, Esplugues de Llobregat
- Castelldefels, Gavà
- Alella, Tiana, Teià (Maresme)
- Badalona, L'Hospitalet de Llobregat

## Q&A Seeds (pre-written for GBP Q&A section)

1. **Q: Do you come to my location?**
   A: Yes! restoreLab is 100% mobile. We bring all professional equipment to your home, office or parking spot anywhere in the Barcelona metro area.

2. **Q: How long does paint correction take?**
   A: It depends on the package. Express Refresh takes 2–3 hours. Full two-stage correction takes 6–8 hours. Ceramic coating needs 24h curing time.

3. **Q: Is ceramic coating worth it?**
   A: Ceramic coating provides years of protection against UV, bird droppings, and minor scratches. Our 5-year Gyeon ceramic saves you money on waxing and keeps your car looking new.

4. **Q: What's the difference between correction and ceramic?**
   A: Correction removes existing defects (swirl marks, scratches). Ceramic coating is a protective layer applied after correction. We recommend both for best results.

5. **Q: Do you work on Tesla / soft EV paint?**
   A: Yes. We have specific protocols for soft clear coats found on Tesla, BMW iX, and other EVs. We use reduced-cut compounds and lower machine speeds.

6. **Q: Can you remove deep scratches?**
   A: We can remove scratches that haven't gone through the clear coat. During assessment, we measure paint depth with a gauge and tell you honestly what's achievable.

7. **Q: How much does paint correction cost?**
   A: Starting from €149 for Express Refresh. Full correction from €549. Ceramic packages from €649. Check restorelab.io/pricing for full details.

8. **Q: Do you offer any guarantee?**
   A: Yes. Satisfaction promise on all work — if you're not happy, we rework it free. Ceramic coatings carry up to 5-year manufacturer warranty.

9. **Q: I'm selling my car. Can you help?**
   A: Our Pre-Sale Detail Pack (from €249) includes correction, headlight restoration, glass clean, interior wipe, and photo report. Clients typically add €1,500–3,000 to their sale price.

10. **Q: What brands do you use?**
    A: We work with Gyeon and Gtechniq ceramics, Rupes polishing machines, Koch Chemie compounds, and XPEL paint protection film. All professional-grade.

## Posting Cadence

### Weekly (every Monday)
- Post 1 before/after case from `/cases` page
- Include: vehicle make, service performed, area served
- Link to the relevant case on website
- Photo: side-by-side before/after

### Monthly (first week)
- Seasonal offer or new service announcement
- Link to pricing page or relevant service landing
- Example: "Summer ceramic coating special" or "New headlight restoration service"

### Quarterly
- Review response roundup (thank top reviewers)
- Milestone post (e.g., "500 vehicles restored")

## OG Metadata Checklist
All pages have OG metadata via BaseLayout.astro:
- [x] og:title, og:description, og:image on every page
- [x] Service pages have dedicated meta
- [x] Area pages have localized meta via templates
- [x] Academy articles have individual meta
- [x] Cases page has meta (individual case detail pages pending RL-107)

## Notes
- Review Cloudflare Polish settings: Speed → Optimization → Polish = Lossy + WebP
- Enable Image Resizing if available on plan
- Keep GBP photos updated monthly with recent work
