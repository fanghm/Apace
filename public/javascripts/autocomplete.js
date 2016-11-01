  $( function() {
    if (name_suggestions.length > 0) {
      $("#owner").autocomplete({
        "lookup": name_suggestions,
        "lookupLimit": 9,
        "autoSelectFirst": true,
        "showNoSuggestionNotice": true,
        "noSuggestionNotice": "Pls provide a valid NOKIA email if name not prompted",
        "onSelect": function (suggestion) {
          $("#owner").data("id", suggestion.data);  // TODO: unset if select and re-input without suggestion
        }
      });
    } else {
      alert("Autocomplete is disabled due to names not imported into database.");
    }

  } );