$(document).on("click", ".show-note", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  var thisId = $(this).attr("data-id"); // Saving article's ID
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    .then(function(data) {
      console.log(data);
      $("#note-modal").modal("toggle");
      $("#notes").append("<h2>" + data.title + "</h2>");
      $("#notes").append("<br><label for='titleinput'>Note Title</label><input class='form-control' id='titleinput' name='title' >");
      $("#notes").append("<br><label for='bodyinput'>Note</label><textarea class='form-control' rows='5' id='bodyinput' name='body'></textarea>");

      // If there's a note in the article...
      if (data.note) {
        // Show title & body of the notes in text section
        $("#titleinput").val(data.note.title);
        $("#bodyinput").val(data.note.body);
      }
    });
});

$("#savenote").on("click", function() {
  var thisId = $(this).attr("data-id");
  $("#note-modal").modal("toggle");

  // Change the note based on user's input
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      title: $("#titleinput").val(),
      body: $("#bodyinput").val()
    }
  })
    .then(function(data) {
      console.log(data);
      $("#notes").empty();
    });

  // Empty values in the text section
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

$(".save-article").on("click", function(event) {
  var id = $(this).attr("data-id");
 
  $.ajax("/saved/" + id, {
    type: "PUT",
  }).then(
    function() {
      location.reload();      // To show up-to-date list
      console.log("Article saved!");
    }
  );
});

$(".delete-article").on("click", function(event) {
  var id = $(this).attr("data-id");
  console.log("deleted article", id);
  $.ajax("/delete/" + id, {
    type: "DELETE",
  }).then(
    function() {
      location.reload();
      console.log("Article deleted.");
    }
  );
});
