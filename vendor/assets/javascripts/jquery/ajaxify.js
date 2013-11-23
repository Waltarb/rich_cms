$.ajaxFormHandlers = {};

$.extend({
  registerAjaxFormHandler: function(handlers) {
    $.extend($.ajaxFormHandlers, handlers);
  }
});

$(document).on("submit", "form.ajaxify", function(event) {
  var form = $(this);

  $.ajax({
    type: form.attr("method") || "GET",
    url : form.attr("action") || window.location.href,
    data: form.serialize(),
    success: function(response) {
      var handler = $.ajaxFormHandlers[form.attr("name")];
      if (handler) {
        handler(form, response);
      }
    }
  });

  event.preventDefault();
});