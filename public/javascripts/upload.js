/* --- handle attachment uploading --- */
$(document).ready( function () {
  $('#upload').show();

  $('#attachAction').on( 'click', function () {
    // Simulate a click on the file input button to show the file browser dialog
    $('#upload input').click();
  });

  $('#upload input').change(function(click) {
    var file = this.files[0];
    var name = file.name;
    var size = formatFileSize(file.size);
    //console.log('upload submit: ' + this.value + '|' + size);

    if (file.size > 20 * 1024 * 1024) {
      alert('Sorry, selected file is too big. Only files less than 20M are allowed to upload.');
      return false;
    }

    $('#upload label').show();

    var ul = $('#upload ul');
    var tpl = $('<li class="working"><a></a><i>(' + size + ')</i><progress max="100" value="10"></progress><span></span></li>');
    tpl.find('a').text(name);
    tpl.appendTo(ul);

    var formData = new FormData(document.querySelector("#upload"));
    formData.append("size", size);

    var dataId = $(".modal-footer #saveAction").data("id");
    formData.append("dataId", dataId);

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,

      xhr: function() {
        var myXhr = $.ajaxSettings.xhr();
        if(myXhr.upload) {
          myXhr.upload.addEventListener('progress', updateProgress, false);
        }
        return myXhr;
      },

      success: function(attachment, textStatus, jqXhr) {
        //console.log('upload success: ' + JSON.stringify(attachment) + '|' + textStatus + '|' + JSON.stringify(jqXhr));
        action_map[dataId].attachments.push(attachment);
        name = attachment.name;
        $('#upload ul li:last-child a').replaceWith('<a href="/uploads/' + name + '" download>' + name + '</a>');
      },

      error: function(jqXhr, textStatus, errorThrown) {
        console.log(errorThrown + '|' + textStatus + '|' + JSON.stringify(jqXhr));
      },

      //Options to tell jQuery not to process data or worry about content-type.
      contentType: false,
      processData: false
    });

  });

  // Listen for clicks on the remove icon
  $('#upload div ul li span').on('click', function() {
    var name = this.parent().find('a').text();
    console.log('remove attachment: ' + name);
    
    // send ajax request to remove attachment; use myXhr.abort to abort big file uploading?
    var data = new FormData();
    data.append("dataId", $(".modal-footer #saveAction").data("id"));
    data.append("name", name);

    $.ajax({
      url: '/unload',
      type: 'POST',
      data: data,
      success: function(data, textStatus, jqXhr) {
        console.log('remove list item: ' + name);
        $('#upload ul li a[href]:contains(name)').parent().remove();
      },
      error: function(jqXhr, textStatus, errorThrown) {
        console.log(errorThrown + '|' + textStatus + '|' + JSON.stringify(jqXhr));
      }
    });
  });

  function updateProgress(e) {
    if(e.lengthComputable) {
      var progress = parseInt(e.loaded / e.total * 100, 10);
      $('#upload ul .working progress').val(progress);
      // console.log('uploading ' + progress + '%');

      if(progress === 100) {
        $('#upload ul .working progress').remove();
        $('#upload ul .working').removeClass('working');
      }
    }
  }

  // Helper function that formats the file sizes
  function formatFileSize(bytes) {
    if (typeof bytes !== 'number') {
      return '';
    }

    if (bytes >= 1000000000) {
      return (bytes / 1000000000).toFixed(2) + ' GB';
    }

    if (bytes >= 1000000) {
      return (bytes / 1000000).toFixed(2) + ' MB';
    }

    return (bytes / 1000).toFixed(2) + ' KB';
  }
});