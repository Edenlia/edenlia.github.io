+++
date = "2024-04-18T00:00:00-00:00"
title = "Dirt: Offline Ray Tracer"
image = "Dirt/veach_mis.png"
alt = ""
color = "#060D14"
description = ""
preview_images = ["Dirt/veach_mis.png", "Dirt/perlin_noise.png", "Dirt/env_map_high.png", "Dirt/volume_rendering.png"]
preview_text = ["Multiple Importance Sampling", "Procedural Texture", "Environment Map", "Volume Rendering"]
preview_aspect_ratios = [1.5, 1, 1, 1]
+++

Assignment of 15668: Physics Based Rendering from CMU

Dirt is a ray tracer written in C++ from scratch.

Features:

- Scene Representation: Sphere, Quads and Mesh
- Materials: Lambertian, Metal, Dielectric, BlinnPhong, Beckmann etc.
- Sampler: Stratified Sampling, Quasi-Monte Carlo Sampling
- Integrators: Material Path Tracer, MIS Path Tracer
- Environment Map
- Volumetric Rendering
- Procedural Textures

