/* --- handle keyboard shortcuts --- */
$(document).ready( function () {

  $(document).keydown(function(e) {
    console.log('key:' + e.which);

    switch(e.which) {
      case 65: // 'a' - add
        if (e.ctrlKey) {
          $('#dlgModal').modal('show');

          e.preventDefault();
          e.stopPropagation();
        }
        break;

      case 69: // 'e' - edit
        if (e.ctrlKey && !($("#dlgModal").data('bs.modal') || {isShown: false}).isShown) {
          $('#dlgModal').modal('show');
        }
        break;

      case 68: // 'd' - delete
        if (e.ctrlKey) {
          // check is modal is show
          if ( ($("#dlgModal").data('bs.modal') || {isShown: false}).isShown ) {
            $('#deleteAction').trigger('click');
          } else {
            // TODO: delete selected item
          }

          e.preventDefault();
          e.stopPropagation();
        }
        break;

      case 83: // 's' - save
        if (e.ctrlKey && ($("#dlgModal").data('bs.modal') || {isShown: false}).isShown) {
          $('#saveAction').trigger('click');

          e.preventDefault();
          e.stopPropagation();
        }
        break;

      case 191: // '/' - search
        if (!($("#dlgModal").data('bs.modal') || {isShown: false}).isShown) {
          $('.dataTables_filter input').focus();

          e.preventDefault();
          e.stopPropagation();
        }
        break;

      default:
        break;
    }
  });

});