function(doc) {
    if (doc.geometry) {
      if (doc.geometry.type == "Polygon") {
        emit( {
                type: 'Polygon',
                coordinates: doc.geometry.coordinates
            },
            doc);
      }
    }
};
