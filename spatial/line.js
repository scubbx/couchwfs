function(doc) {
    if (doc.geometry) {
      if (doc.geometry.type == "LineString") {
        if (doc.properties){ var props = doc.properties} else { var props = {} };
        emit( {
                type: 'LineString',
                coordinates: doc.geometry.coordinates
            },
            props);
      }
    }
};
