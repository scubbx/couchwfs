function(doc) {
    if (doc.geometry) {
      if (doc.geometry.type == "Point") {
        emit( {
                type: 'Point',
                coordinates: doc.geometry.coordinates
            },
            doc);
      }
    }
};
