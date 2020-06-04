
# Point cloud web renderer


In this repository, an open-source web-based point cloud renderer is released. The software is developed on top of the well-established [three.js](https://threejs.org/) library, ensuring compatibility across different devices and operating systems. The renderer supports visualization of point clouds with real-time interaction, while viewing conditions can be configured. The user is able to choose between either an adaptive, or a fixed splat size rendering mode in order to display the models. The renderer supports both PLY and PCD point cloud file formats. The current settings have been optimized for voxelized contents, without this limiting its usage, since any point cloud can be displayed independently of its geometric structure (i.e., regular or irregular). The source code is made publicly open for future extensions and refinements.

In this repository, three applications of the point cloud renderer are provided. In particular:
- **pointCloudViewer**: Standalone viewer of a single point cloud model. Several models can be sequentially displayed, if specified by the user.
- **pointCloudQualityAssessmentTestbed**: Side-by-side viewer of point clouds, including annotation of the models and a panel for rating. This testbed was used for the subjective evaluations of [1].
- **pointCloudViewGrabber**: Tool to either reproduce the session of a user, or to display pre-defined views of a model. This tool was used to obtain projections of the point clouds under assessment, before computing the projection-based objective quality metrics in [1].


Additional folders:
- **assets**: Contains two sub-folders, namely, models and pointsize. The former contains the point cloud models under inspection, while the latter carries meta-data files related to the points size of each model.
- **thirdParty**: External libraries that the software depends on (i.e., dependencies).

Information related to a model, the rendering parameters, the viewing conditions, and interactivity settings can be adjusted through configuration files in each application. Examples of usage are provided. Below, a screenshot of the quality assessment testbed used in [1] is illustrated:

![alt text](/docs/testbed.png)
*\*The depicted point cloud is re-distributed within the **[M-PCCD](https://www.epfl.ch/labs/mmspg/downloads/quality-assessment-for-point-cloud-compression)** dataset (original model source: [link](https://sketchfab.com/3d-models/amphoriskos-clean-point-cloud-85cba491e0a84ce58dc4a75715073ad2), creator: [Megan Bystricky](https://sketchfab.com/meganbystricky), license: [CC Attribution](https://creativecommons.org/licenses/by/4.0/)).*


### Dependencies

The [three.js]([https://threejs.org/](https://threejs.org/)) library is a dependency of the software. The necessary scripts are included in the **thirdParty** folder. Note that two different versions are provided (r97 and r110). The authors developed and used the software based on three.js-r97. Although the software is now compliant to a later version, namely three.js-r110, no extensive experimentation and testing has been conducted.


### Same-origin policy

In order to load external files (i.e., models, meta-data, config files, etc.) in the renderer and avoid browsers' security restrictions, you should [run the software from a local web server](https://threejs.org/docs/index.html#manual/en/introduction/How-to-run-things-locally).


### Application

The software ran on top of three.js-r97 and the authors used Google Chrome browser and [MAMP](https://www.mamp.info/en/) local web server environment in the context of [1]. For more information about the selected viewing conditions and rendering parameters (i.e., rendering mode, canvas size, screen resolution, etc.), the reader can refer to [1].


### Conditions of use

If you wish to use this software in your research, we kindly ask you to cite [1].


### References

[1] Alexiou, E., Viola, I., Borges, T., Fonseca, T., De Queiroz, R., & Ebrahimi, T. (2019). [A comprehensive study of the rate-distortion performance in MPEG point cloud compression](https://infoscience.epfl.ch/record/272124). APSIPA Transactions on Signal and Information Processing, 8, E27. doi:10.1017/ATSIP.2019.20
