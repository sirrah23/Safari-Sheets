/*
* Take the data that is in the user input into
* the textarea and send it to the server for 
* upload to Google Sheets...
* TODO: Do not do anything if the textarea is empty
*/
$(function() {
  $('#bookform').submit(function() {
        $.ajax({
            type: 'POST',
            url: 'submit-book-data',
            data: {"bookdata": $('#bookdata').val()},
        }).done(() => {
          alert("Data sent to server for upload!!");
        });
        return false;
    }); 
});