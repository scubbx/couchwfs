function(doc) {
    if (doc.geometry) {
      if (doc.geometry.type == "Point") {
        if (doc.properties){ var props = doc.properties} else { var props = {} };
        emit( {
                type: 'Point',
                coordinates: doc.geometry.coordinates
            },
            props);
      }
    }
};
