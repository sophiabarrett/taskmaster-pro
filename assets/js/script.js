var tasks = {};

// color code task based on due date
var auditTask = function(taskEl) {
  // get task's date
  var date = $(taskEl).find("span").text().trim();
  // convert to moment object at 5:00 pm
  var time = moment(date, "L").set("hour", 17);
  // remove any old classes
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");
  // new classes if date is near or past
  if (time.isBefore(moment())) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (time.isBefore(moment().add(3, "days"))) {
    $(taskEl).addClass("list-group-item-warning");
  }
}

setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, 1800000)

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // color code task based on due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// when user clicks on a task's text, replace it with a textarea where it can be edited
$(".list-group").on("click", "p", function() {
  var text = $(this)
    .text()
    .trim();
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

// when user clicks out of textarea, save new text
$(".list-group").on("blur", "textarea", function() {
  // get the textarea's current value/text
  var text = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the tasks's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task and save to localStorage
  tasks[status][index].text = text;
  saveTasks();

  // convert task text back to p
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);
  $(this).replaceWith(taskP);
});

// when user clicks due date, allow editing
$(".list-group").on("click", "span" , function() {
  // get current text
    var date = $(this).text().trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  dateInput.datepicker({
   minDate: 0,
    onClose: function() {
      // when datepicker is closed, force a "change" event on dateInput
      $(this).trigger("change");
    }
  });

  // automatically focus on new element
  dateInput.trigger("focus");
});

// when user clicks out of date input, save new date
$(".list-group").on("change", "input[type='text']", function() {
  // get current text
  var date = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the tasks's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to local storage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // color code based on date
  auditTask($(taskSpan).closest(".list-group-item"));
});

// make tasks draggable within and between lists
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  cursor: "move",
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
  },
  // once task is dropped, save new lists
  update: function(event) {
    // array to store task data
    var tempArr = [];
    // loop over current set of children in soratable list
    $(this).children().each(function() {
      var text = $(this).find("p").text().trim();
      var date = $(this).find("span").text().trim();
      // add task data to tempArr as an object
      tempArr.push({
        text: text,
        date: date
      });
    });
    // trim down list's ID to match object property
    var arrName = $(this).attr("id").replace("list-", "");
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

// make trash droppable area
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
  },
  over: function(event, ui) {
    console.log("over");
    $(".bottom-trash").addClass("bottom-trash-activate");
  },
  out: function(event, ui) {
    console.log("out");
    $(".bottom-trash").removeClass("bottom-trash-activate");
  }
});

// add datepicker to modal
$("#modalDueDate").datepicker({
 minDate: 0
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();


