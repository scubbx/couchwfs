function(head, req) {
  var m_ServiceName = "CouchDB WFS";
  var m_Title = "Demo CouchWFS Server";
  var m_url = "http://gisforge.no-ip.org:5984/wfs2/_design/wfs/_spatial/_list/wfspolygon/polygon?";
  var m_ProviderName = "Markus Mayr";
  var m_CoordSystem = "EPSG:4326";
  var m_FeatureTypeName = "All Polygons";
  var m_FeatureTypeTitle = "All Polygons";
  //var m_FeatureTypeBBox = [13.35,48.22,13.37,48.24];
  var m_FeatureTypeBBox = [-180,-90,180,90];
  var m_cwfsNS = "http://gisforge.no-ip.org:5984/wfs2/"; // the couchWFS NameSpace
  

  if (req.query.REQUEST == "GetCapabilities" || req.query.request == "GetCapabilities"){
    start({'headers': {'content-type': 'text/xml; subtype=gml/3.1.1'} });
    // -- Header
    
    send('<WFS_Capabilities xmlns="http://www.opengis.net/wfs" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0" updateSequence="0" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd">');
      send('<!-- CouchWFS version 0.2 SUPPORTS=WFS_SERVER SUPPORTS=WFS_CLIENT -->'); // angelehnt an die Geoserver Angaben
      send('<Service>');
        send('<Name>'+m_ServiceName+'</Name>');
        send('<Title>'+m_Title+'</Title>');
        send('<OnlineResource>'+m_url+'</OnlineResource>'); // die default URL des WFS
      send('</Service>');
      
      send('<Capability>');
        send('<Request>');
          send('<GetCapabilities>'); // es wird aufgrund REST nur GET unterstützt
            send('<DCPType>');
              send('<HTTP>');
                send('<Get onlineResource="'+m_url+'"/>'); // abermals default URLs des WFS
              send('</HTTP>');
            send('</DCPType>');
          send('</GetCapabilities>');
          send('<DescribeFeatureType>');
            send('<SchemaDescriptionLanguage>');
              send('<XMLSCHEMA/>');
            send('</SchemaDescriptionLanguage>');
            send('<DCPType>');
              send('<HTTP>');
                send('<Get onlineResource="'+m_url+'"/>'); // abermals default URLs des WFS
              send('</HTTP>');
            send('</DCPType>');
          send('</DescribeFeatureType>');
          send('<GetFeature>');
            send('<ResultFormat>');
              send('<GML2/>'); // ACHTUNG: welcher Standard wird nun tatsächlich verwendet? SimpleFeatures?
            send('</ResultFormat>');
            send('<DCPType>');
              send('<HTTP>');
                send('<Get onlineResource="'+m_url+'"/>'); // abermals default URLs des WFS
              send('</HTTP>');
            send('</DCPType>');
          send('</GetFeature>');
        send('</Request>');
      send('</Capability>');
      
      send('<FeatureTypeList>');
        send('<Operations>');
          send('<Query/>');
        send('</Operations>');
        
          // START FEATURETYPE -------------
          send('<FeatureType>');
            send('<Name>'+m_FeatureTypeName+'</Name>');
            send('<Title>'+m_FeatureTypeTitle+'</Title>');
            send('<SRS>'+m_CoordSystem+'</SRS>');
            send('<LatLongBoundingBox minx="'+m_FeatureTypeBBox[0]+'" miny="'+m_FeatureTypeBBox[1]+'" maxx="'+m_FeatureTypeBBox[2]+'" maxy="'+m_FeatureTypeBBox[3]+'"/>');
            send('<!-- WARNING: Required Feature Id attribute (fid) not specified for this feature type. Make sure you set one of wfs_featureid, ows_featureid or gml_featureid metadata. -->'); // wie? was?
          send('</FeatureType>');
          // END FEATURETYPE -------------
          // weitere FeatureTypes hier einfügen
          
        send('</FeatureTypeList>');
      send('<ogc:Filter_Capabilities>'); // muss man leere Filter_Capabilities anführen?
        send('<ogc:Spatial_Capabilities>');
          send('<ogc:Spatial_Operators>');
            send('<ogc:BBOX/>');
          send('</ogc:Spatial_Operators>');
        send('</ogc:Spatial_Capabilities>');
      send('</ogc:Filter_Capabilities>');
    send('</WFS_Capabilities>');

  } else if((req.query.REQUEST == "DescribeFeatureType") || (req.query.request == "DescribeFeatureType")){
    start({'headers': {'content-type': 'text/xml; subtype=gml/3.1.1'} }); // soll laut Standard so sein
    // -- Header

    // START AGGREGATE PROPERTIES
    var row;
    var aggprops = {};
    while ( row = getRow() ) {
      for(var key in row.value){
        aggprops[key] = true;
      };
    };
    // END AGGREGATE PROPERTIES
    
    send('<?xml version="1.0" ?>');
    send('<schema xmlns:cwfs="'+m_cwfsNS+'" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml" targetNamespace="http://mapserver.gis.umn.edu/mapserver" elementFormDefault="qualified" version="0.1">');  // !! "xmlns:ms" geaendert in "xmlns:cwfs"
      send('<import namespace="http://www.opengis.net/gml" schemaLocation="http://schemas.opengis.net/gml/2.1.2/feature.xsd"/>');
      
      // START ELEMENT ------------
      send('<element name="polygon" type="cwfs:polygonType" substitutionGroup="gml:_Feature"/>'); // !! name & polygonType = new
      send('<complexType name="polygonType">');
        send('<complexContent>');
          send('<extension base="gml:AbstractFeatureType">');
            send('<sequence>');
    // START LIST OF ATTRIBUTES
              for(var prop in aggprops){
                send('<element name="' +prop+ '" type= "string" />');
              };
    // END LIST OF ATTRIBUTES
              send('<element name="cwfsGeometry" type="gml:GeometryPropertyType" minOccurs="0" maxOccurs="1"/>');
              
            send('</sequence>');
          send('</extension>');
        send('</complexContent>');
      send('</complexType>');
      // END ELEMENT ------------
      // add additional elements here
      
    send('</schema>');

  } else if((req.query.REQUEST == "GetFeature") || (req.query.request == "GetFeature")){
    // generate the XML/GML response
    start({'headers': {'content-type': 'text/xml; subtype=gml/3.1.1'} });
    
  // preprocess response from the database
    var row;
    var elementlist = [];
    var elementbbox = [];
    var allLeft = [];
    var allLower = [];
    var allRight = [];
    var allUpper = [];
    
    while ( row = getRow() ) {
      // build PolygonCoordinates & BoundingBox
      var coorddata = row.geometry.coordinates[0];
      var polyLength = coorddata.length;
      var gmlCoords = "";
      allLeft.push(row.bbox[0]);
      allLower.push(row.bbox[1]);
      allRight.push(row.bbox[2]);
      allUpper.push(row.bbox[3]);
      for (var i=0;i<polyLength;i++) {
        gmlCoords += (coorddata[i][0]+","+coorddata[i][1]+" ");
      };
      row["gmlCoords"] = gmlCoords;
      elementlist.push(row);
    };

    // START CALCULATE BOUNDINGBOX ---------
    
    var maxLeft = Math.min.apply(null,allLeft);
    var maxLower = Math.min.apply(null,allLower);
    var maxRight = Math.max.apply(null,allRight);
    var maxUpper = Math.max.apply(null,allUpper);
    elementbbox = [maxLeft,maxLower,maxRight,maxUpper];
    
    // elementbbox = m_FeatureTypeBBox;
    
    // END CALCULATE BOUNDING BOX ---------

    // send the response XML
    send('<?xml version="1.0" encoding="UTF-8"?>');
    send('<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.example.com/myns http://localhost:8888/wfsservlet?featureTypeId=1 http://www.opengis.net/wfs ../wfs/1.0.0/WFS-basic.xsd" >');
    
      send('<gml:boundedBy xmlns:gml="http://www.opengis.net/gml" >');
        send('<gml:Box srsName="'+m_CoordSystem+'" >');
          //send('<gml:coordinates>'+m_FeatureTypeBBox[0]+','+m_FeatureTypeBBox[1]+' '+m_FeatureTypeBBox[2]+','+m_FeatureTypeBBox[3]+'</gml:coordinates>');
          send('<gml:coordinates>'+elementbbox[0]+','+elementbbox[1]+' '+elementbbox[2]+','+elementbbox[3]+'</gml:coordinates>');
        send('</gml:Box>');
      send('</gml:boundedBy>');
      
      //loop here
      for(var j=0;j<elementlist.length;j++){
        var element = elementlist[j];
      
      
        send('<gml:featureMember xmlns:gml="http://www.opengis.net/gml" >');
          send('<cwfs:POLYGONS xmlns:cwfs="'+m_cwfsNS+'" fid="'+j+'" >');
          
          // START ATTRIBUTES
            for(var prop in element.value){
              if(element.value[prop]){send('<cwfs:' +prop+ '>' +element.value[prop]+ '</cwfs:' +prop+ '>');};
            };
          // END ATTRIBUTES
            
            send('<cwfs:SHAPE>');
              send('<gml:Polygon xmlns:gml="http://www.opengis.net/gml" srsName="'+m_CoordSystem+'" >');
                send('<gml:outerBoundaryIs>');
                  send('<gml:LinearRing>');
                    send('<gml:coordinates decimal="." cs="," ts=" " >');
                      send(element.gmlCoords);
                    send('</gml:coordinates>');
                  send('</gml:LinearRing>');
                send('</gml:outerBoundaryIs>');
              send('</gml:Polygon>');
            send('</cwfs:SHAPE>');
          send('</cwfs:POLYGONS>');
        send('</gml:featureMember>');
      };
      // end loop here
      
    send('</wfs:FeatureCollection>');
  };
}
