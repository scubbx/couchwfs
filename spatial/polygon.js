function(doc) {
    if (doc.geometry) {
      if (doc.geometry.type == "Polygon") {
        if (doc.properties){ var props = doc.properties} else { var props = {} };
        emit( {
                type: 'Polygon',
                coordinates: doc.geometry.coordinates
            },
            props);
      }
    }
};
