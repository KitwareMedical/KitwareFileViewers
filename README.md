# KitwareFileViewers

Cross-browser extension that lets you conveniently open URLs with Kitware online viewers such as Glance, VTK.js or itk-vtk-viewer. It can also open 🖥️ desktop viewers such as 3D Slicer.

![Screenshot](images/Screenshot.png)
*Example of usage with [Girder](https://girder.readthedocs.io/en/latest/) (e.g. https://data.kitware.com)*


# Install

Install the extension from your browser web store:
 - [Chrome](https://chrome.google.com/webstore/detail/kitware-file-viewers/lklknpjabnmfefcfhmhdnhebkpindcld) 
 - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/kitware-file-viewers/)
 - [Edge](https://microsoftedge.microsoft.com/addons/detail/kitware-file-viewers/kfejllcdobijgoijjpfcbaoicjbdkhfb)

# Viewers

The following 💻 online viewers are supported:
 - [Kitware Glance](https://kitware.github.io/glance/)
 - [Kitware VolView](https://volview.kitware.com/)
 - [itk-vtk-viewer](https://kitware.github.io/itk-vtk-viewer/docs/)
 - [VTK.js viewer examples](https://kitware.github.io/vtk-js/examples/)

The following 🖥️ desktop viewers are supported:
 - [3D Slicer](https://www.slicer.org/)



|              |                |
|:------------------:|:------------------: |
|![VolView](images/VolView.png) *Kitware VolView* | ![Glance](images/Glance.png) *Kitware Glance*
|![itk-vtk-viewer](images/itk-vtk-viewer.png) *itk-vtk-viewer*| ![VTK.js examples](images/vtk-js-examples.png) *VTK.js examples* |
| ![Slicer](images/Slicer.png) *3D Slicer*


## File support

Most viewers need to be opened with the file extension as parameter.
First the extension attempts to extract the file extension from the URL.
Because some URLs may not contain the file extension, as an optional second step, the extension downloads a few bytes of the file and attempts to detect the file extension by reading the file headers.
This is not perfect and does not work well with ZIP archives because no unzipping is performed (yet).
Here is the explicit list of files supported by the extension :
 - dcm (DICOM)
 - glance (Kitware glance state file)
 - mha (Meta)
 - nii (Nifti)
 - nrrd
 - obj
 - obz (Zip of obj+mtl)
 - stl
 - vti (vtkImageData)
 - vtk (Legacy VTK)
 - vtkjs (Zip)
 - vtp (vtkPolyData)
 - vtu (vtkUnstructedGrid)

# Usage

Right click on a link in any webpage to open the context menu.

You can also select the text of an url and right click to open the context menu.

## Local files

You can also visualize local files. You just have to serve your files. Here are some one-liners to help you do so:

### Python

```
python.exe -m http.server 8000
```

### Node.js

```
npm install -g http-server
http-server -p 8000 --cors
```

Then you can open on your browser localhost:8000 to see your files.

## 3D Slicer

Shall you want to open your URLs with 3D Slicer, you need to save the [LoadRemoteFile module](https://github.com/PerkLab/SlicerSandbox/blob/master/LoadRemoteFile/LoadRemoteFile.py) into the qt-scripted-modules folder of 3D Slicer.
It will work automatically on Windows. There is [more setup required](https://github.com/PerkLab/SlicerSandbox/blob/master/README.md#loadremotefile) on other OS.


# Browser support

It is known to work with at least the following desktop browsers:
 - Firefox 108.0.2
 - Chrome 108.0.5359.126
 - Edge 109.0.1518.55

It should work (not tested) with:
 - all chromium-based browsers such as Opera

A bit more work is required to support:
 - Safari

# Debug

To develop and debug, you can manually install the extension by following those tutorials 

 - Chrome: Follow the [Loading unpacked extension tutorial](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
 - Firefox: Follow the [Temporary installation tutorial](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).
 - Edge: Follow the [Sideload an extension tutorial](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading).


# Packaging #

## Manifest v2 package ##

Copy manifests/manifest-v2.json into manifest.json.
Create a zip archive.

## Manifest v3 package ##

Copy manifests/manifest-v3.json into manifest.json.
Create a zip archive.

# Help and Support #
[Kitware](https://www.kitware.com/) offers advanced software R&D solutions and services. Find out how we can help with your next project.
