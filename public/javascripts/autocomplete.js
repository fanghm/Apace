  $( function() {
    // var availableTags = ['Fang Frank', 'Li Wei', 'Dong Riano', 'Jin Shuqiang', 'Ma Cassie' ];
    $( "#owner" ).autocomplete({
      lookup: name_list
    });
  } );