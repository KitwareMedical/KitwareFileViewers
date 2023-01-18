console.log('-------------------------');

const dataTypes = {
  ImageData: 'ImageData',
  PolyData: 'PolyData',
  UnstructuredGrid: 'UnstructuredGrid',
  Scene: 'Scene'
};

const fileTypes = {
  DICOM: 'dcm',
  glance: 'glance',
  legacyVTK: 'vtk',
  meta: 'mha',
  nifti: 'nii',
  nrrd: 'nrrd',
  obj: 'obj',
  obz: 'obz', // zip of obj + mtl
  stl: 'stl',
  vtkjs: 'vtkjs',
  vtkXMLImageData: 'vti',
  vtkXMLPolyData: 'vtp',
  vtkXMLUnstructuredGrid: 'vtu',
  zip: 'zip',
}

const fileTypeToExtension = {
  dcm: dataTypes.ImageData,
  glance: dataTypes.Scene,
  mha: dataTypes.ImageData,
  nrrd: dataTypes.ImageData,
  obj: dataTypes.PolyData,
  obz: dataTypes.Scene,
  stl: dataTypes.PolyData,
  vti: dataTypes.ImageData,
  vtkjs: dataTypes.Scene,
  vtp: dataTypes.PolyData,
  vtu: dataTypes.UnstructuredGrid,
}

function isVTKFile(fileHeaderString) {
  const re = /<VTKFile type="(\w*)"/i;
  const vtkType = fileHeaderString.match(re);
  if (vtkType) {
    return {fileType: fileTypes['vtkXML' + vtkType[1]], dataType: vtkType[1]};
  }
}

const legacyDatasetTypes = {
  POLYDATA: dataTypes.PolyData,
  IMAGEDATA: dataTypes.ImageData,
  UNSTRUCTURED_GRID: dataTypes.UnstructuredGrid,
}

function isVTKLegacyFile(fileHeaderString) {
  if (fileHeaderString.startsWith('# vtk DataFile Version')) {
    console.log('starts with');
    const datasetRegex = /(?<=DATASET )\w+/g;
    const dataset = fileHeaderString.match(datasetRegex);
    console.log(dataset);
    if (dataset) {
      return {fileType: fileTypes.legacyVTK, dataType: legacyDatasetTypes[dataset[0]] };
    }
  }
}

function isZIPFile(fileHeaderString) {
  if (fileHeaderString.startsWith('PK')) {
    // TODO: support more than scenes
    return {fileType: fileTypes.zip, dataType: dataTypes.Scene };
  }
}

function isNrrdImage(fileHeaderString) {
  if (fileHeaderString.startsWith('NRRD')) {
    return {fileType: fileTypes.nrrd, dataType: dataTypes.ImageData};
  }
}

function isMetaImage(fileHeaderString) {
  if (fileHeaderString.match(/ObjectType ?= ?\w+/gi) &&
      fileHeaderString.match(/NDims ?= ?\d+/gi) &&
      fileHeaderString.match(/DimSize ?= ?\d+/gi)) {
    return {fileType: fileTypes.mha, dataType: dataTypes.ImageData};
  }
}

function isDICOMImage(fileHeader) {
  const magicNumber = fileHeader.slice(128, 132);
  const isDICOM = new TextDecoder().decode(magicNumber) === "DICM";
  if (isDICOM) {
    return {fileType: fileTypes.DICOM, dataType: dataTypes.ImageData};
  }
}

function isNiftiImage(fileHeader) {
  const magicNumber = fileHeader.slice(344, 347);
  const isNii = new TextDecoder().decode(magicNumber) === "n+1"; // ni1 for .hdr
  if (isNii) {
    return {fileType: fileTypes.nifti, dataType: dataTypes.ImageData};
  }
}

function isSTLMesh(fileHeader) {
  const fileHeaderString = new TextDecoder().decode(fileHeader);
  if (fileHeaderString.startsWith('solid ')) {
    return {fileType: fileTypes.stl, dataType: dataTypes.PolyData };
  }
  // FIXME: not very robust
  const numberOfTriangles = new Uint32Array(fileHeader.buffer, 80, 1);
  // Number of triangles should be reasonable
  if (numberOfTriangles > 0 && numberOfTriangles < 4294967295) {
    return {fileType: fileTypes.stl, dataType: dataTypes.PolyData };
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const menuIdSeparator = ':';
  const viewers = {
    'Kitware Glance (.glance, .vtkjs, .vt?, .stl, .obj, .obz, .nrrd, .nii, .mha, .dcm)': "https://kitware.github.io/glance/app/?name={fileName}.{fileType}&url={encode:{url}}",
    'VTK.js volume viewer (.vti)': "https://kitware.github.io/vtk-js/examples/VolumeViewer/VolumeViewer.html?fileURL={encode:{url}}",
    'VTK.js geometry viewer (.vtp)': "https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL={encode:{url}}",
    'VTK.js scene viewer (.vtkjs)': "https://kitware.github.io/vtk-js/examples/SceneExplorer/SceneExplorer.html?fileURL={encode:{url}}",
    'VTK.js obj viewer (.obz, .zip)': "https://kitware.github.io/vtk-js/examples/OBJViewer/OBJViewer.html?fileURL={encode:{url}}",
    'itk-vtk-viewer (.vti, .nrrd, .nii, .mha, .dcm, .stl)': 'https://kitware.github.io/itk-vtk-viewer/app/?fileToLoad={encode:{url}{noFileName:/{fileName}.{fileType}}}',
  };
  Object.keys(viewers).forEach((name) => {
    chrome.contextMenus.create({
      id: `link${menuIdSeparator}${name}`,
      title: `... link in ${name}`,
      type: 'normal',
      contexts: ['link'],
    });
  });
  Object.keys(viewers).forEach((name) => {
    chrome.contextMenus.create({
      id: `selection${menuIdSeparator}${name}`,
      title: `... %s in ${name}`,
      type: 'normal',
      contexts: ['selection'],
    });
  });

  async function detectFileType(fileHeader) {
    const fileHeaderString = new TextDecoder().decode(fileHeader);
    let res;
    if (res = isVTKFile(fileHeaderString)) { // VTK XML
      return res;
    } else if (res = isVTKLegacyFile(fileHeaderString)) {// VTK Legacy
      return res;
    } else if (res = isZIPFile(fileHeaderString)) { // ZIP
      return res;
    } else if (res = isNrrdImage(fileHeaderString)) { // Nrrd
      return res;
    } else if (res = isMetaImage(fileHeaderString)) { // Meta
      return res;
    } else if (res = isDICOMImage(fileHeader)){ // DICOM
      return res;
    } else if (res = isNiftiImage(fileHeader)) { // nifti
      return res;
    } else if (res = isSTLMesh(fileHeader)) { // STL should be the last one to be checked
      return res;
    }
  }

  async function fetchFileType(url) {
    // If file is large, do not waste time to download it fully
    const MAX_HEADER_LENGTH = 348; // nii has a 4-byte magic number located at byte 344.
    try {
      const response = await fetch(url, {
        // headers: {
        //   'Range': `bytes=0-${MAX_HEADER_LENGTH-1}`
        // },
      })
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
      return await detectFileType(header);
    }
    catch (error) {
      console.error(error)
    };
  }

  function getFileTypeFromURL(url) {
    const supportedExtensions = Object.values(fileTypes);
    for (let i = 0; i < supportedExtensions.length; ++i) {
      const extension = supportedExtensions[i];
      const regex = new RegExp('[^/]+(?=\\.'+ extension + '\\b)', 'i');
      const match = url.match(regex);
      if (match) {
        return {
          fileName: match[0],
          fileType: extension,
          dataType: fileTypeToExtension[extension]
        };
      }
    }
    return {fileName: undefined, fileType: undefined, dataType: undefined};
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
    let {fileName, fileType, dataType} = getFileTypeFromURL(url);
    console.log('From URL: file name=', fileName,
      ', file type=', fileType,
      ', data type=', dataType);
    if (!fileType || !dataType) {
      const res = await fetchFileType(url);
      if (res) {
        ({fileType, dataType} = res);
        console.log('From file header: file type=', fileType,
                    ', data type=', dataType);
      }
    }
    const viewerUrl = viewer
      .replaceAll(/\{noFileName:([^\{\}]*\{[^\{\}]*\}[^\{\}]*)+\}/g, '')
      .replaceAll('{fileName}', fileName || 'data')
      .replaceAll('{fileType}', fileType)
      .replaceAll('{url}', url)
      .replaceAll(/{encode:(.*)}/g, (_, group) => encodeURIComponent(group));
    chrome.tabs.create({url: viewerUrl});
  }
  
  chrome.contextMenus.onClicked.addListener(openViewer);
});
