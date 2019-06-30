/*  
	Project: Custom Radio buttons
	Description: jQuery plugin to replace radio inputs
	Author: Mario Iliev

	---------------------------
	Initialize the plugin (two options):
	1. Call the plugin on element containing radio buttons - $(selector).customRadio();
	2. Add "data-radio-custom" tag on <div> containing radio buttons and the plugin will run with the default options

	---------------------------
	Radio button text:
	If no additional paramters are specified, the plugin will take the radio input value text
	Available options for "text:" are: 'empty', 'value', 'title' or custom 'data' type value. 
	Example: $(selector).customRadio({text: 'data-custom-title'});

	---------------------------
	Disable radio buttons:
	$(selector).customRadio({disabled: true});
	- the <label> wrapper gets "disabled" class selector

	---------------------------
	To destroy the plugin:
	$(selector).customRadio({destroy: true});

	---------------------------
	Styling:
	Each radio button is wrapped in <label> element with the following class selectors:
	"radio_btn"
	"selected" (when button is clicked)
	"radio_#"  ("#" is uniqe number for each radio button)
	
	"customClass:" You can add custom class selector: 
	-	$(selector).customRadio({customClass: 'myclass'});

	Each Label contains <span> with the text of the radio button
*/

;(function ($) {
	'use strict';
	var instance = 0;
	var beenDisabled = 0;

	var RadioButtons = function (el, opts) {
		var element = $(el).is('[type=radio]') ? $(el) : $(el).find('[type=radio]');
		var alreadyCalled = element.parent().is('label');
		var customClass = opts.customClass ? ' ' + opts.customClass : '';
		var disabled = opts.disabled;
		var textSource = opts.text;
		var destroy = opts.destroy;
		var text = function(el) {
			var textValue = $(el).attr(textSource);

			if (textSource == 'empty') return '';
			else if (!textValue) return 'No text source';
			else if (textSource) return textValue;
		};
		var clicкEvents = function(labels, thisLabel) {
			labels.parent().removeClass('selected');
			$(thisLabel).addClass('selected');
		};
		var destroyPlugin = function(element) {
			if (element.parent().is('label')) {
				element
					.removeAttr('style')
					.parent()
						.off('touchstart.customradio click.customradio')
						.find('span').remove();
				element.unwrap();
			}
		};

		// Hide input radio
		if (destroy) {
			destroyPlugin(element);
			return;
		} else {
			element.css({'position':'absolute', 'top':'0', 'left':'0', 'margin':'0', 'z-index':'-1', 'opacity':'0'});
		}
		// We only need to do this only once
		if (!alreadyCalled) {
			element
				.wrap('<label/>')
				.parent()
					.append('<span>')
					.on('touchstart.customradio click.customradio', function() {
						clicкEvents(element, this);
					})
					.css({'cursor':'pointer', 'position':'relative'});
		}

		// Flexible changes if "customRadio" is called more than once
		element.each(function() {
			var object_number = ++instance;

			$(this)
				.parent()
					.removeAttr('class')
					.addClass('radio_btn radio_' + object_number + customClass)
					.find('span').text(text(this));
		});

		// If we want to disable radio buttons
		if (disabled) {
			beenDisabled++;

			element
				.attr('disabled', true)
					.parent()
						.addClass('disabled')
						.css({'cursor':'not-allowed'})
						.off('touchstart.customradio click.customradio');
		} else {
			element
				.attr('disabled', false)
					.parent()
						.removeClass('disabled')
						.css({'cursor':'pointer'});
		}

		// Return click events if we re-enable buttons
		if (alreadyCalled && beenDisabled != 0) {
			element
				.parent()
					.on('touchstart.customradio click.customradio', function() {
						clicкEvents(element, this);
					});
		}
	};

	$.fn.customRadio = function (options, callback) {
		var opts = $.extend({}, $.fn.customRadio.defaults, options, callback);

		return this.each(function () {
			new RadioButtons($(this), opts);
		});
	}
	$.fn.customRadio.defaults = { text: 'value', customClass: '', disabled: false, destroy: false };

	$('div[data-radio-custom]').customRadio();

})(jQuery);
