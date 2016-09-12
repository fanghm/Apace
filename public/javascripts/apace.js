$(document).ready( function () {
  // access tab directly via anchor, and display anchor in url
  $(function() {
    var hash = window.location.hash;
    hash && $('ul.nav a[href="' + hash + '"]').tab('show');

    $('.nav-tabs a').click(function (e) {
      $(this).tab('show');
      var scrollmem = $('body').scrollTop() || $('html').scrollTop();
      window.location.hash = this.hash;
      $('html,body').scrollTop(scrollmem);
    });
  });

  $('#le').datetimepicker({
    //timepicker: false,
    defaultTime:'17:00',
    closeOnDateSelect:true,
    format: 'Y/m/d H:i',
    weeks: true,
    minDate: 0, // no later than today, not valid when edit an item
    lang: 'zh',
  });

  var t = $('#tblAction').DataTable( {
    // "columnDefs": [ {
    //     "searchable": false,
    //     "orderable": false,
    //     "targets": 0
    //   } ],
    // "order": [[ 1, 'asc' ]]
  });

  t.on( 'order.dt search.dt', function () {
    t.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
        cell.innerHTML = i+1;
    } );
  } ).draw();

  // prevent modal loading previous data
  // note: only modal data are removed, data-* attributes bounded on the trigger button need extra handling/reset
  $('body').on('hidden.bs.modal', '.modal', function () {
    $(this).removeData('bs.modal'); // modal-title not removed somehow
  });

  $('#dlgModal').on('shown.bs.modal', function() {
    $('#title').focus();
  });

  // Triggered when modal is about to be shown
  $('#dlgModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);  // Button that triggered the modal
    var dataId = button.data('id');       // Extract info from data-* attributes
    var btnId = button.attr("id");
    // console.log('btnId: ' + btnId + ', dataId: ' + dataId );

    if ( typeof(button) === 'undefined'  // modal triggered by keyboard shortcut instead of button click
          || (typeof(dataId) === 'undefined' || dataId === '') ) {  // add
      $(".modal-title").text( 'Add an action point' );

      $("#deleteAction").hide();
      $("#grp_history").hide();
      $("#grp_status").hide();
      $(".modal-footer #saveAction").data("id", "");  // mandatory!

      $(".modal-body #title").val("");
      $(".modal-body #desc").val("");
      $('.modal-body #category').val("");
      $(".modal-body #le").val("");
      $(".modal-body #owner").val("");
      //$("input[name=status][value='New']").attr('checked', 'checked');

    } else {  // edit/delete

      $(".modal-title").text( 'Edit an action point' );

      var row = button.closest("tr").find("td:nth-child(1)").text();
      // console.log("dataId: " + dataId + " row: " + row);

      // set data-id attr for db update, set data-row for view update
      $(".modal-footer #saveAction").data("id", dataId);
      $(".modal-footer #saveAction").data("row", row);

      $(".modal-footer #deleteAction").data("id", dataId);
      $(".modal-footer #deleteAction").data("row", row);
      console.log("#saveAction.data-id:" + $(".modal-footer #saveAction").data("id"));
      console.log("#deleteAction.data-row:" + $(".modal-footer #deleteAction").data("row"));

      $("#deleteAction").show();
      $("#grp_history").show();
      $("#grp_status").show();

      //console.log('update action: ' + JSON.stringify(action_map[dataId]) );
      $(".modal-body #title").val( action_map[dataId].title );
      $(".modal-body #desc").val( action_map[dataId].desc );
      $('.modal-body #category').val( action_map[dataId].category );
      $('.modal-body #le').val( moment(action_map[dataId].le).format('YYYY/MM/DD HH:mm') );
      $(".modal-body #owner").val( action_map[dataId].owner );

      //console.log("action_map[dataId].history: " + action_map[dataId].history);
      $(".modal-body #history").val( action_map[dataId].history );
      $("input[name=status][value='" + action_map[dataId].status + "']").prop("checked", true);

    }

  });

  // delete an item
  $('#deleteAction').on( 'click', function () {
    var dataId = $(this).data('id');
    var row = $(this).data('row');
    // console.log("onclick #deleteAction.data-id: " + dataId + ", data-row: " + row);

    var yes = confirm('Are you sure you want to delete this action?');
    if (yes) {
      $.ajax({
        type: 'DELETE',
        url: '/delete/' + dataId
      }).done(function( res ) {
        if (res.msg === '') {
          var tr = $('#' + dataId);
          // console.log("deleted: " + JSON.stringify(tr));
          // draw(false): redraw the table keeping the current paging
          t.row(tr).remove().draw( false );
        } else {
          alert('Error: ' + res.msg);
        }
      });

      $('#dlgModal').modal('hide');
    } else {
      return false;
    }

  });

  // add/edit an item
  $('#saveAction').on( 'click', function () {
    var row = $(this).data('row');
    var dataId = $(this).data("id");  // or: $(".modal-footer #saveAction").data("id");
    // console.log("onclick #saveAction.data-id: " + dataId + ", data-row: " + row);

    // data validation
    var allowSubmit = true;
    $.each($('form input:text'), function(index, formField) {
      if($(formField).val().trim().length == 0) {
        alert( 'Field cannot be empty: ' + $(formField).attr("id") );
        allowSubmit = false;
        return false;
      }
    });

    if ( $('#category').val().trim().length == 0 ) {
      alert( 'Field cannot be empty: ' + 'category' );
      allowSubmit = false;
    }

    if (!allowSubmit) {
      return false;
    }

    var data = {
      title:    $('#title').val(),
      desc:     $('#desc').val(),
      category: $('#category').val(),
      le:       moment( $('#le').val().trim() , 'YYYY-MM-DD HH:mm'),
      owner:    $('#owner').val(),
      status:   'New',
    };

    var addAction = true;
    var url = '/add';
    var method = 'POST';

    if (typeof dataId !== 'undefined' && dataId != '') {
      addAction = false;
      url = '/update/' + dataId;
      method = 'PUT';

      data.history = $('#history').val();
      data.status = $('input[name=status]:checked').val();
    }

    $.ajax({
      url: url,
      type: method,
      dataType: 'json',
      data: JSON.stringify(data),
      contentType: 'application/json',

      success: function(action, textStatus, jQxhr) {
        console.log('data to ' + (addAction ? 'add' : 'edit') + ': ' + JSON.stringify(data));
        //console.log('saved: ' + JSON.stringify(action));

        // TODO: display inserted/updated item on current page, no scrolling to other page
        if (addAction) {
          //moment.locale('zh-cn');

          t.row.add( [
            '',
            action.title,
            action.category,
            action.status,
            action.owner,
            moment(action.le).format('YYYY-MM-DD HH:mm'),
            moment(action.update_at).fromNow(),
            '<a class="btn btn-primary" data-id="' + action._id + '" data-toggle="modal" data-target="#dlgModal"> <span class="glyphicon glyphicon-edit"></span> </a>'
          ] ).draw( false );

          action_map[action._id] = action;

        } else {  // update
          //var tr = $('#tblAction tbody tr').eq(row);
          var tr = $('#' + dataId);
          //console.log('update row: ' + row + ', tr:\n' + tr.html());

          tr.find('td:eq(0)').html( row ); // col 1
          tr.find('td:eq(1)').html( action.title ); // col 2
          // console.log('td title:' + tr.find('td:eq(1)').html());

          tr.find("td:nth-child(3)").html( action.category ); // col 3
          tr.find("td:nth-child(4)").html( action.status );
          tr.find("td:nth-child(5)").html( action.owner );
          tr.find("td:nth-child(6)").html( moment(action.le).format('YYYY-MM-DD HH:mm') );
          tr.find("td:nth-child(7)").html( moment(action.update_at).fromNow() );

          t.row(tr).invalidate().draw(false);
          //console.log('updated tr to:' + $('#' + dataId).html());  // TODO: undefined when not visible in current page

          // update action_map (for later update of same item as we read data from the map to render modal)
          action_map[dataId] = action;
        }

        $('#dlgModal').modal('hide');
      },

      error: function( jqXhr, textStatus, errorThrown ) {
        console.log( errorThrown );
      }
    });

  });  // end of onclick

  // tab operation
  $('#li_my').hide();

  function activaTab(tab){
      $('.nav-tabs a[href="#' + tab + '"]').tab('show');
  };

  $('#btnLogin').on( 'click', function () {
    var data = {
      uid: $('#uid').val().trim(),
      pass: $('#pass').val().trim()
    };

    $.ajax({
      url: '/login',
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify(data),
      contentType: 'application/json',

      success: function(user, textStatus, jQxhr) {
        console.log('Auth succeed: ' + JSON.stringify(user));

        // $('.nav-tabs li:last').before('<li class="pull-right"> <a href="#my" data-toggle="tab">' + user.name 
        //   + '<button class="close" type="button" title="Remove">×</button> </a> </li>');
        //$('.tab-content').append('<div class="tab-pane" id="my"><p>welcome</p></div>');

        //hideTab('login');
        //activaTab('my');
        //$('#login').hide();

        $('#li_my a label').html(user.name);
        $('#li_my').show();
        $('#li_my a').click();

        $('#li_login').hide();
      },

      error: function( jqXhr, textStatus, errorThrown ) {
        console.log( errorThrown );
      }
    });

  });

  $('.nav-tabs').on('click', '.close', function() {
    var yes = confirm('Log out?');
    if (yes) {
      $('#li_my').hide();
      $('#li_login').show();
      //$('#li_login a').click();
      //activaTab('login');

      //display main tab
      var tabFirst = $('.nav-tabs a:first');
      //tabFirst.tab('show');
      tabFirst.click();
    }
  });

});