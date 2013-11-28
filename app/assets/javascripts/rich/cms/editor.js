Rich.Cms.Editor = (function() {
  var content_class        = "rich_cms_content", mark_class = "marked", edit_panel = "#rich_cms_panel",
      editable_content     = {}, content_items = "";

  var register = function(hash) {
    $.extend(editable_content, hash);
    content_items = $.map($.keys(editable_content), function(css_class) { return "." + css_class; }).join(",");
  };

  var bind = function() {
    $(document).on("click", "#rich_cms_panel .edit form fieldset.inputs div.keys a.toggler", function(event) {
      event.preventDefault();
      var toggler = $(event.target);
      toggler.hide().closest(".keys").find("select[name=" + toggler.attr("data-name") + "]").show();
    });

    $("#rich_cms_panel .edit a.close").bind("click", function(event) {
      event.preventDefault();
      RaccoonTip.close();
    });

    RaccoonTip.register("." + content_class + "." + mark_class, "#rich_cms_panel", {
                          beforeShow: edit,
                          canHide: function() { return !$("#cleditor_input").length; },
                          afterHide: function(content) { content.hide(); }
                        });

    bindSeatHolders();

    $.registerAjaxFormHandler({
      "rich_cms_content": afterUpdate
    });
  };

  var bindSeatHolders = function() {
    RaccoonTip.register("." + content_class + "." + mark_class + ".sh_hint", "#rich_cms_panel", {event: "focus", beforeShow: edit, afterHide : function(content) { content.hide(); }});
  };

  var mark = function(event) {
    event.preventDefault();

    $(content_items).addClass(content_class).toggleClass(mark_class);

    var markedContentItems = $(content_items + "." + mark_class);
    if (markedContentItems.length) {
      $.each(markedContentItems, function() {
        var item = $(this);
        if (item.find("p").length || item.html().length > 50) {
          item.addClass("block");
        }
      });
      bindSeatHolders();
    } else {
      $(content_items + ".block").removeClass("block");
      $(edit_panel).hide();
    }

    if (typeof(SeatHolder) != "undefined") {
      SeatHolder.react(!markedContentItems.length);
    }
  };

  var edit = function() {
    var content_item = $(this).closest(".rich_cms_content");
    var keys         = $("#rich_cms_panel .edit form fieldset.inputs div.keys");
    var inputs       = $("#rich_cms_panel .edit form fieldset.inputs");

    var attrs        = content_item.get(0).attributes;
    var css_class    = $.grep($.keys(editable_content), function(css_class) {
                         return content_item.is("." + css_class);
                       })[0];
    var specs        = editable_content[css_class];

    keys.find("select,a,span").remove();
    inputs.find(":input,div.cleditorMain").remove();
    inputs.append("<input name='content_item[__css_class__]' type='hidden' value='" + css_class + "'/>");

    $.each(attrs, function(index, attribute) {
      var attr = attribute.name;

      if (attr.match(/^data-/)) {
        var name  = "content_item[" + attr.replace(/^data-/, "") + "]";
        var value =  content_item.attr(attr);

        if (attr == specs.value) {
          var editable_input_type = content_item.attr("data-editable_input_type") || (content_item.is("textarea") || content_item.hasClass("block") ? "text" : "string");

          switch (editable_input_type) {
            case "string":
              inputs.append("<input name='" + name + "' type='text' value='" + value + "'/>"); break;
            case "text":
              inputs.append("<textarea name='" + name + "'>" + value + "</textarea>"); break;
            case "html":
              inputs.append("<textarea id='cleditor_input' name='" + name + "' style='width: 500px; height: 300px'>" + value + "</textarea>"); break;
          }
        } else if (specs.keys.indexOf(attr) != -1) {
          var available_keys = $.map(value.split(","), function(key) { return $.trim(key); });
          var default_key    = available_keys[0];

          if (specs.keys.length > 1 && keys.find("select").length > 0) {
            keys.append("<span>, <span>");
          }

          keys.append(available_keys.length == 1 ?
                        "<span>" + default_key + "<span>" :
                        "<a href='#' class='toggler' data-attr='" + attr + "' data-name='" + name + "'>" + default_key + "</a>");
          keys.append("<select name='" + name + "' style='display: none'>" +
                         $.map(available_keys, function(key) { return "<option value='" + key + "'>" + key + "</option>"; }).join("") +
                      "</select>");
        } else {
          inputs.append("<input name='" + name + "' type='hidden' value='" + value + "'/>");
        }
      }
    });

    $("#rich_cms_panel .edit form fieldset.inputs div.keys select").bind("blur", function(event) {
      var select  = $(event.target);
      var toggler = select.hide().closest(".keys").find(".toggler[data-name=" + select.attr("name") + "]").html(select.val()).show();
      var values  = [select.val()];

      $.map(select.find("option"), function(option) {
        var value = $(option).val();
        if (value != values[0]) {
          values.push(value);
        }
      });

      content_item.attr(toggler.attr("data-attr"), values.join(", "));
    });

    if (specs.beforeEdit) {
      var identifier = $.map(specs.keys, function(key) { return "[" + key + "=" + content_item.attr(key) + "]"; }).join("");
      specs.beforeEdit.apply(null, [inputs, css_class, specs, identifier]);
    }

    $(edit_panel).show();

    setTimeout(function() {
      if ($("#cleditor_input").length) {
        $("#cleditor_input").cleditor({
          width : 500,
          height: 300
        })[0].focus();
      }
    }, 250);
  };

  var afterUpdate = function(form, response) {
    var css_class  = response["__css_class__"];
    var specs      = editable_content[css_class];
    var identifier = $.map(specs.keys, function(key) { return "[" + key + "=" + response["__identifier__"][key.replace(/^data-/, "")] + "]"; }).join("");

    var defaultFunction = function(form, response, css_class, specs, identifier) {
      var value = response[specs.value.replace(/^data-/, "")];

      $.each($(identifier), function(index, element) {
        var html = $(element).attr("data-mustache_locals") ?
                     Mustache.to_html(value, eval("({" + $(element).attr("data-mustache_locals") + "})")) :
                     value;
        $(element).html(html).attr(specs.value, value);
      });

      if (typeof(SeatHolder) != "undefined") {
        SeatHolder.rebind();
      }
    };

    (specs.afterUpdate || defaultFunction).apply(null, [form, response, css_class, specs, identifier]);
  };

  return {
    init: function() {
      bind();
    },
    register: register,
    mark:     mark
  };
}());
