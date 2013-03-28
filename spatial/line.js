function(doc) {
    if (doc.geometry) {
      if (doc.geometry.type == "LineString") {
        emit( {
                type: 'LineString',
                coordinates: doc.geometry.coordinates
            },
            doc);
      }
    }
};
