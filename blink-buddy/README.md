# BLINK Buddy (3D)
Living VRM anime companion for BLINK: spring-bone hair and skirt, blinking, look-at, expressions,
event reactions (gym, sleep, food, water, screen time, study, wake) and actions (chair, ice cream,
balloons you can pop, crawl, snake, sideways, peek, dance) with a live edit panel.

- `index.html` – page with buttons and the edit panel (loads three.js + three-vrm from unpkg)
- `buddy3d.js` – character engine
- `outfit.py` – restyles a VRoid VRM: crop top, pleated skirt with skirt spring bones
  (`python outfit.py in.vrm out.vrm`)

Put a VRM exported from VRoid Studio next to `index.html` as `buddy.vrm` and serve the folder over http.
