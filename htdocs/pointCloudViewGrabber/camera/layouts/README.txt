
Evangelos Alexiou
evangelos.alexiou@epfl.ch


- The files **6_views** and **42_views** define camera parameters to visualize a model from a corresponding number of uniformly distributed positions on the surface of a view sphere. These camera parameters were used to acquire views in order to compute projection-based objective scores in [1].

- To ensure identical positions and avoid misalignments in the computation of the projection-based scores, fixed offsets to translate the geometry of each variation of a content were used. In the **offsets.csv** file, the offsets for the geometry translation per model can be found. As an example, in ../../config/config001.json the translation offset for amphoriskos model is used.


### References

[1] Alexiou, E., Viola, I., Borges, T., Fonseca, T., De Queiroz, R., & Ebrahimi, T. (2019). A comprehensive study of the rate-distortion performance in MPEG point cloud compression. APSIPA Transactions on Signal and Information Processing, 8, E27. doi:10.1017/ATSIP.2019.20
