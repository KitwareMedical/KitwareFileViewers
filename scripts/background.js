console.log('Installing Open...');
const dataTypes = {
  ImageData: 'ImageData',
  PolyData: 'PolyData',
  UnstructuredGrid: 'UnstructuredGrid',
  Scene: 'Scene'
};

const FILE_TYPES = [];

function getFileType(name, fileTypes = FILE_TYPES) {
  return fileTypes.find((fileType) => fileType.name === name );
}
function isZip(fileTypeName, header) {
  const matchingFileTypes = [];
  if (header.asString.startsWith('PK')) {
    // TODO: support more than scenes
    matchingFileTypes.push({...getFileType(fileTypeName)});
  }
  return matchingFileTypes;
}

FILE_TYPES.push({
    name: 'DICOM',
    extension: 'dcm',
    mimeType: ['application/dicom', 'application/dicom+xml'],
    dataType: dataTypes.ImageData,
    checkHeader: (header) => {
      const matchingFileTypes = [];
      const magicNumber = header.asBuffer.slice(128, 132);
      const isDICOM = new TextDecoder().decode(magicNumber) === "DICM";
      if (isDICOM) {
        matchingFileTypes.push({...getFileType('DICOM')});
      }
      return matchingFileTypes;
    }
  });

FILE_TYPES.push({
  name: 'Glance',
  extension: 'glance',
  mimeType: ['/glance', 'application/zip'],
  dataType: dataTypes.Scene,
  checkHeader: isZip.bind(null, 'Glance')
});

const legacyDatasetTypes = {
  POLYDATA: dataTypes.PolyData,
  IMAGEDATA: dataTypes.ImageData,
  UNSTRUCTURED_GRID: dataTypes.UnstructuredGrid,
}

FILE_TYPES.push({
  name: 'VTK legacy',
  extension: 'vtk',
  mimeType: ['/vtk'],
  dataType: [dataTypes.ImageData, dataTypes.PolyData, dataTypes.UnstructuredGrid],
  checkHeader: (header) => {
    const matchingFileTypes = [];
    if (header.asString.startsWith('# vtk DataFile Version')) {
      console.log('starts with');
      const datasetRegex = /(?<=DATASET )\w+/g;
      const dataset = header.asString.match(datasetRegex);
      console.log(dataset);
      if (dataset) {
        matchingFileTypes.push({...getFileType('VTK legacy'), dataType: legacyDatasetTypes[dataset[0]] });
      }
    }
    return matchingFileTypes;
  }
});

FILE_TYPES.push({
  name: 'Meta IO',
  extension: 'mha',
  mimeType: ['/mha'],
  dataType: dataTypes.ImageData,
  checkHeader: (header) => {
    const matchingFileTypes = [];
    if (header.asString.match(/ObjectType ?= ?\w+/gi) &&
      header.asString.match(/NDims ?= ?\d+/gi) &&
      header.asString.match(/DimSize ?= ?\d+/gi)) {
      matchingFileTypes.push({...getFileType('Meta IO')});
    }
    return matchingFileTypes;
  }
});

FILE_TYPES.push({
  name: 'Nifti',
  extension: 'nii',
  mimeType: ['/nii'],
  dataType: dataTypes.ImageData,
  checkHeader: (header) => {
    const matchingFileTypes = [];
    const magicNumber = header.asBuffer.slice(344, 347);
    const isNii = new TextDecoder().decode(magicNumber) === "n+1"; // ni1 for .hdr
    if (isNii) {
      matchingFileTypes.push({...getFileType('Nifti')});
    }
    return matchingFileTypes;
  }
});

FILE_TYPES.push({
  name: 'Nrrd',
  extension: 'nrrd',
  mimeType: ['/nrrd'],
  dataType: dataTypes.ImageData,
  checkHeader: (header) => {
    const matchingFileTypes = [];
    if (header.asString.startsWith('NRRD')) {
      matchingFileTypes.push({...getFileType('Nrrd')});
    }
    return matchingFileTypes;
  }
});

FILE_TYPES.push({
  name: 'OBJ',
  extension: 'obj',
  mimeType: ['*/obj'],
  dataType: dataTypes.PolyData,
});

FILE_TYPES.push({
  name: 'OBZ',
  extension: 'obz',
  mimeType: ['/obz', 'application/zip'],
  dataType: dataTypes.Scene,
  checkHeader: isZip.bind(null, 'OBZ')
});

FILE_TYPES.push({
  name: 'STL',
  extension: 'stl',
  mimeType: ['/stl'],
  dataType: dataTypes.PolyData,
  checkHeader: (header) => {
    const matchingFileTypes = [];
    // Ascii
    if (header.asString.startsWith('solid ')) {
      matchingFileTypes.push({...getFileType('STL')});
    } else if (header.asBuffer.length > 84) { // Binary
      // FIXME: not very robust
      const emptyHeader = new Uint32Array(header.asBuffer.buffer, 40, 10);
      if (emptyHeader.every((val) => val === 0)) {
        const numberOfTriangles = new Uint32Array(header.asBuffer.buffer, 80, 1);
        // Number of triangles should be reasonable
        if (numberOfTriangles > 0 && numberOfTriangles < 4294967295) {
          console.log('is stl');
          matchingFileTypes.push({...getFileType('STL')});
        }
      }
    }
    return matchingFileTypes;
  }
});

FILE_TYPES.push({
  name: 'VTK.js',
  extension: 'vtkjs',
  mimeType: ['/vtkjs', 'application/zip'],
  dataType: dataTypes.Scene,
  checkHeader: isZip.bind(null, 'VTK.js')
});

function isVTKFile(dataType, header) {
  const matchingFileTypes = [];
  const re = new RegExp("<VTKFile type=\"" + dataType + "\"", 'i');
  const vtkType = header.asString.match(re);
  if (vtkType) {
    matchingFileTypes.push({...getFileType('vtkXML' + dataType)});
  }
  return matchingFileTypes;
}

FILE_TYPES.push({
  name: 'vtkXMLImageData',
  extension: 'vti',
  mimeType: ['/vti', 'application/xml', 'text/xml'],
  dataType: dataTypes.ImageData,
  checkHeader: isVTKFile.bind(null, 'ImageData')
});

FILE_TYPES.push({
  name: 'vtkXMLPolyData',
  extension: 'vtp',
  mimeType: ['/vtp', 'application/xml', 'text/xml'],
  dataType: dataTypes.PolyData,
  checkHeader: isVTKFile.bind(null, 'PolyData')
});

FILE_TYPES.push({
  name: 'vtkXMLUnstructuredGrid',
  extension: 'vtu',
  mimeType: ['/vtu', 'application/xml', 'text/xml'],
  dataType: dataTypes.UnstructuredGrid,
  checkHeader: isVTKFile.bind(null, 'UnstructuredGrid')
});

FILE_TYPES.push({
  name: 'ZIP',
  extension: 'zip',
  mimeType: ['application/zip'],
  dataType: dataTypes.Scene,
  checkHeader: isZip.bind(null, 'ZIP')
});

function mergeFileTypeProperty(property, otherProperty) {
  if (property == null) return otherProperty;
  if (otherProperty == null) return property;
  // Let's KISS by returning the property with less values.
  if (Array.isArray(property)) {
    if (Array.isArray(otherProperty)) {
      return property.length > otherProperty.length ? otherProperty : property;
    }
    return otherProperty;
  }
  return property;
}

function mergeFileTypes(fileTypes, otherFileTypes) {
  const matchingFileTypes = fileTypes.map((fileType) => {
    const otherFileType = getFileType(fileType.name, otherFileTypes);
    if (otherFileType) {
      return Object.keys(fileType).reduce((res, key) => {
          return {...res, [key]: mergeFileTypeProperty(fileType[key], otherFileType[key])};
        }, {});
    }
    return {...fileType};
  });
  return matchingFileTypes;
}

const VIEWERS = [];

VIEWERS.push({
  name: 'Kitware Glance',
  type: 'online',
  extension: ['.glance', '.vtkjs', '.vt?', '.stl', '.obj', '.obz', '.nrrd', '.nii', '.mha', '.dcm'],
  url: "https://kitware.github.io/glance/app/?name={fileName}.{fileType}&url={encode:{url}}"
});

VIEWERS.push({
  name: 'Kitware VolView',
  type: 'online',
  extension: ['.zip', '.dcm', '.mha'],
  url: "https://volview.netlify.app/?names=[{fileName}.{fileType}]&urls=[{encode:{url}}]"
});

VIEWERS.push({
  name: 'itk-vtk-viewer',
  type: 'online',
  extension: ['.vti', '.nrrd', '.nii', '.mha', '.dcm', '.stl'],
  url: "https://kitware.github.io/vtk-js/examples/OBJViewer/OBJViewer.html?fileURL={encode:{url}}"
});

VIEWERS.push({
  name: 'VTK.js',
  type: 'online',
  extension: ['.vti', '.vtp', '.vtkjs', '.obz', '.zip'],
});

VIEWERS.push({
  name: 'Volume viewer',
  type: 'online',
  extension: ['.vti'],
  parent: 'VTK.js',
  url: "https://kitware.github.io/vtk-js/examples/VolumeViewer/VolumeViewer.html?fileURL={encode:{url}}"
});

VIEWERS.push({
  name: 'Geometry viewer',
  type: 'online',
  extension: ['.vtp'],
  parent: 'VTK.js',
  url: "https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL={encode:{url}}"
});

VIEWERS.push({
  name: 'Scene viewer',
  type: 'online',
  extension: ['.vtkjs'],
  parent: 'VTK.js',
  url: "https://kitware.github.io/vtk-js/examples/SceneExplorer/SceneExplorer.html?fileURL={encode:{url}}"
});

VIEWERS.push({
  name: 'Obj viewer',
  type: 'online',
  extension: ['.obz', '.zip'],
  parent: 'VTK.js',
  url: "https://kitware.github.io/vtk-js/examples/OBJViewer/OBJViewer.html?fileURL={encode:{url}}"
});

VIEWERS.push({
  name: '3D Slicer',
  type: 'desktop',
  extension: ['.nrrd', '.nii', '.mha', '.dcm'],
  url: "slicer://viewer/?download={encode:{url}{noFileName:/{fileName}.{fileType}}}"
});

function getViewers(type, viewers = VIEWERS) {
  return viewers.filter((viewer) => viewer.type === type);
}

function getViewer(type, name, viewers = VIEWERS) {
  return viewers.find((viewer) => viewer.type === type && viewer.name === name);
}

const menuIdSeparator = ':';
chrome.runtime.onInstalled.addListener(async () => {
  console.log('onInstalled...');
  const viewerTypes = {
    online: "💻",
    desktop: "🖥️",
  }
  const viewersIds = {selection: {}, link: {}};
  function addActionInContextMenu(viewerType) {
    getViewers(viewerType).forEach((viewer) => {
      let displayName = viewer.name;
      let linkPrefix = `Open in ${viewerTypes[viewerType]}`;
      let selectionPrefix = `Open in ${viewerTypes[viewerType]}`;
      if (viewer.parent != null) {
        linkPrefix = '';
        selectionPrefix = '';
      }
      if (viewer.extension) {
        displayName = displayName + '(' + viewer.extension.join(', ') + ')';
      }
      viewersIds.link[viewer.name] = chrome.contextMenus.create({
        id: `${viewerType}${menuIdSeparator}link${menuIdSeparator}${viewer.name}`,
        title: `${linkPrefix}${displayName}`,
        type: 'normal',
        contexts: ['link'],
        parentId: viewersIds.link[viewer.parent]
      });
      viewersIds.selection[viewer.name] = chrome.contextMenus.create({
        id: `${viewerType}${menuIdSeparator}selection${menuIdSeparator}${viewer.name}`,
        title: `${selectionPrefix}${displayName}`,
        type: 'normal',
        contexts: ['selection'],
        parentId: viewersIds.selection[viewer.parent]
      });
      console.log('create context menus for viewer', viewer.name, viewersIds.link[viewer.name], viewersIds.selection[viewer.name]);
    });
  };
  
  Object.keys(viewerTypes).forEach((viewerType, index) => {
    if (index > 0) {
      chrome.contextMenus.create({
        id: `separator${menuIdSeparator}${index}`,
        type: 'separator',
        contexts: ['link', 'selection']
      });
    }
    addActionInContextMenu(viewerType);
  });

});

async function detectFileType(fileHeaderBuffer, fileTypes = FILE_TYPES) {
  let matchingFileTypes = [];
  const header = {
    asBuffer: fileHeaderBuffer,
    asString: new TextDecoder().decode(fileHeaderBuffer)
  };
  fileTypes.forEach((fileType) => {
    if (fileType.checkHeader) {
      matchingFileTypes = matchingFileTypes.concat(fileType.checkHeader(header));
    }
  });
  return matchingFileTypes;
}


function getFileTypeFromURL(url, fileTypes = FILE_TYPES) {
  const matchingFileTypes = [];
  fileTypes.forEach((fileType) => {
    const extensions = [fileType.extension].flat();
    extensions.forEach((extension) => {
      const regex = new RegExp('[^/]+(?=\\.'+ extension + '\\b)', 'i');
      const match = url.match(regex);
      if (match) {
        const matchingFileType = {
          ...fileType,
          extension,
          fileName: match[0]
        };
        matchingFileTypes.push(matchingFileType);
      }
    });
  });
  return matchingFileTypes;
}


function getFileTypeFromContentDisposition(contentDisposition, fileTypes = FILE_TYPES) {
  let matchingFileTypes = [];
  console.log({contentDisposition});
  if (contentDisposition) {
    const regex = /attachment; filename="(.+)"/;
    const match = contentDisposition.match(regex);
    if (match) {
      const fileName = match[1];
      console.log(fileName);
      matchingFileTypes = getFileTypeFromURL(fileName, fileTypes);
    }
  }
  return matchingFileTypes;
}

function getFileTypeFromContentType(contentType, fileTypes = FILE_TYPES) {
  let matchingFileTypes = [];
  console.log({contentType});
  if (contentType) {
    fileTypes.forEach((fileType) => {
      const mimeTypes = [fileType.mimeType].flat();
      const matchingMimeType = mimeTypes.find((mimeType) => contentType.includes(mimeType));
      if (matchingMimeType) {
        const matchingFileType = {
          ...fileType,
          mimeType,
        };
        matchingFileTypes.push(matchingFileType);
      }
    });
  }
  return matchingFileTypes;
}

// FIXME: won't work in case of asynchronous file checking

let acceptRanges = true;
/**
 * Run a HEAD request to extract information from the returned headers
 * to avoid performing an expensive (client+server) download request.
 */
async function getFileTypeFromHeadRequest(url, fileTypes = FILE_TYPES) {
  let matchingFileTypes = [];
  try {
    const response = await fetch(url, {method: "head"});
    if (!response.ok) {
      console.log('aborted', response);
      throw new Error('Error with HEAD request');
    }
    const contentDisposition = response.headers.get("content-disposition");
    let contentDispositionMatchingFileTypes = getFileTypeFromContentDisposition(contentDisposition, fileTypes);

    const contentType = response.headers.get("content-type");
    let contentTypeMatchingFileTypes = getFileTypeFromContentType(contentType, fileTypes);
    matchingFileTypes = mergeFileTypes(contentDispositionMatchingFileTypes, contentTypeMatchingFileTypes);

    acceptRanges = response.headers.get("accept-ranges") === 'bytes';

    // Requested on chrome to not trigger error.
    await response.text();
  }
  catch (error) {
    console.error(error)
  };
  return matchingFileTypes;
}

async function getFileTypeFromFirstBytes(url, fileTypes) {
  let matchingFileTypes = [];
  // If file is large, do not waste time to download it fully
  const MAX_HEADER_LENGTH = 348; // nii has a 4-byte magic number located at byte 344.
  try {
    const response = await fetch(url, {
      headers: acceptRanges ? {
        'Range': `bytes=0-${MAX_HEADER_LENGTH-1}`
      } : {},
    })
    if (!response.ok) {
      console.log('aborted', response);
      throw new Error('Error fetching file');
    }
    const reader = response.body.getReader();
    // FIXME: allocate it was a meaningful default length
    let header = new Uint8Array();
    while (header.length < MAX_HEADER_LENGTH) {
      const {value, done} = await reader.read();
      if (done) break;
      const newHeader = new Uint8Array(header.length + value.length);
      newHeader.set(header);
      newHeader.set(value, header.length);
      header = newHeader;
    }
    console.log('header length:', header.length);
    matchingFileTypes = await detectFileType(header, fileTypes);
  }
  catch (error) {
    console.error(error)
  };
  return matchingFileTypes;
}

async function openViewer(info, tab) {
  console.log('onClicked...')
  const [viewerType, sourceType, viewerName] = info.menuItemId.split(menuIdSeparator);
  const viewer = getViewer(viewerType, viewerName);
  if (!viewer) {
    console.log('NOT', viewerName);
    // Not a supported menu item
    return;
  }
  let url;
  if (sourceType === 'selection') {
    url = info.selectionText;
  }
  else {
    url = info.linkUrl;
  }
  console.log('URL:', url);
  let matchingFileTypes = [];
  if (matchingFileTypes.length != 1) {
    matchingFileTypes = getFileTypeFromURL(url);
    console.log('From URL:', matchingFileTypes);
  }
  // FIXME keep checking if dataType is > 1
  if (matchingFileTypes.length != 1) {
    matchingFileTypes = await getFileTypeFromHeadRequest(url, matchingFileTypes.length ? matchingFileTypes : undefined);
    console.log('From HEAD:', matchingFileTypes);
  }
  if (matchingFileTypes.length != 1) {
    matchingFileTypes = await getFileTypeFromFirstBytes(url, matchingFileTypes.length ? matchingFileTypes : undefined);
    console.log('From file header:', matchingFileTypes);
  }
  if (matchingFileTypes.length >= 1) {
    const {fileName, extension} = matchingFileTypes[0];
    const fileType = [extension].flat()[0];
    const viewerUrl = viewer.url
      .replaceAll('{fileName}', fileName || 'data')
      .replaceAll('{fileType}', fileType)
      .replaceAll('{url}', url)
      .replaceAll(/{noFileName:([^\}]*)}/g, (_, group) => fileName ? '' : group)
      .replaceAll(/{encode:(.*)}/g, (_, group) => encodeURIComponent(group));
    chrome.tabs.create({url: viewerUrl});
  }
}

chrome.contextMenus.onClicked.addListener(openViewer);
