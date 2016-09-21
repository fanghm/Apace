  $( function() {
    if (name_list.length > 0) {
      $( "#owner" ).autocomplete({
        lookup: name_list
      });
    } else {
      alert("Autocomplete is disabled due to names not imported into database.")
    }
  } );