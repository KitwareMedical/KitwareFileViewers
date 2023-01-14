console.log('-------------------------');

chrome.runtime.onInstalled.addListener(async () => {
  const menuIdSeparator = ':'
  const viewers = {
    'Kitware Glance (.vt[p,i,u], .nrrd)': "https://kitware.github.io/glance/app/?name=data.{fileType}&url={encode:{url}}",
    'VTK.js volume viewer (.vti)': "https://kitware.github.io/vtk-js/examples/VolumeViewer/VolumeViewer.html?fileURL={encode:{url}}",
    'VTK.js geometry viewer (.vtp, .obj)': "https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL={encode:{url}}",
    'VTK.js scene viewer (.vtkjs)': "https://kitware.github.io/vtk-js/examples/SceneExplorer/SceneExplorer.html?fileURL={encode:{url}}",
    'VTK.js obj viewer (.obj, .mtl)': "https://kitware.github.io/vtk-js/examples/OBJViewer/OBJViewer.html?fileURL={encode:{url}}",
    'itk-vtk-viewer (.nrrd, .vti)': 'https://kitware.github.io/itk-vtk-viewer/app/?fileToLoad={encode:{url}/data.{fileType}}',
  };
  const fileTypes = {
    vtkXMLPolyData: 'vtp',
    vtkXMLImageData: 'vti',
    vtkXMLUnstructuredGrid: 'vtu',
    zip: 'zip',
    DICOM: 'dcm',
    nrrd: 'nrrd'
  }
  Object.keys(viewers).forEach((name) => {
    chrome.contextMenus.create({
      id: `link${menuIdSeparator}${name}`,
      title: `link in ${name}`,
      type: 'normal',
      contexts: ['link'],
    });
  });
  Object.keys(viewers).forEach((name) => {
    chrome.contextMenus.create({
      id: `selection${menuIdSeparator}${name}`,
      title: `%s in ${name}`,
      type: 'normal',
      contexts: ['selection'],
    });
  });

  function detectFileType(fileHeader) {
    const fileHeaderString = new TextDecoder().decode(fileHeader);
    const re = /<VTKFile type="(\w*)"/i;
    const vtkType = fileHeaderString.match(re);
    if (vtkType) { // VTK XML
      return fileTypes['vtkXML'+vtkType[1]];
    } else if (fileHeaderString.startsWith('PK')) { // ZIP
      //FIXME: try to read inside the zip...
      return fileTypes.zip;
    } else if (fileHeaderString.startsWith('NRRD')) { // NRRD
      return fileTypes.nrrd;
    } else {
      const magicNumber = fileHeader.slice(127,131);
      const isDICOM = new TextDecoder().decode(magicNumber) === "DICM";
      if (isDICOM) {
        return fileTypes.DICOM;
      }
    }
  }

  async function fetchFileType(url) {
    // If file is large, do not waste time to download it fully
    const MAX_HEADER_LENGTH = 256;
    try {
      const response = await fetch(url, {headers: {
        'Range': `bytes=0-${MAX_HEADER_LENGTH-1}`
      },})
      if (!response.ok) {
        console.log('aborted', response);
        throw new Error('Error fetching file');
      }
      const reader = response.body.getReader();
      let header = new Uint8Array();
      while (header.length < MAX_HEADER_LENGTH) {
        const {value, done} = await reader.read();
        if (done) break;
        const newHeader = new Uint8Array(header.length + value.length);
        newHeader.set(header);
        newHeader.set(value, header.length);
        header = newHeader;
      }
      return detectFileType(header);
    }
    catch (error) {
      console.error(error)
    };
  }

  async function openViewer(info, tab) {
    const menuItemId = info.menuItemId.split(menuIdSeparator);
    const viewerName = menuItemId[1];
    const viewer = viewers[viewerName];
    if (!viewer) {
      console.log('NOT ', viewerName);
      // Not a supported menu item
      return;
    }
    let url;
    if (menuItemId[0] === 'selection') {
      url = info.selectionText;
    }
    else { 
      url = info.linkUrl;
    }
    console.log('URL:', url);
    const fileType = await fetchFileType(url);
    console.log('FileType', fileType);
    const viewerUrl = viewer
      .replaceAll('{fileType}', fileType)
      .replaceAll('{url}', url)
      .replaceAll(/{encode:(.*)}/g, (_, group) => encodeURIComponent(group));
    chrome.tabs.create({url: viewerUrl});
  }
  
  chrome.contextMenus.onClicked.addListener(openViewer);
});
