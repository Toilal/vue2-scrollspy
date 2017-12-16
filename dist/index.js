'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = install;
function install(Vue, options) {
  var bodyScrollEl = {};

  // For ff, ie
  Object.defineProperty(bodyScrollEl, 'scrollTop', {
    get: function get() {
      return document.body.scrollTop || document.documentElement.scrollTop;
    },
    set: function set(val) {
      document.body.scrollTop = val;
      document.documentElement.scrollTop = val;
    }
  });

  Object.defineProperty(bodyScrollEl, 'scrollHeight', {
    get: function get() {
      return document.body.scrollHeight || document.documentElement.scrollHeight;
    }
  });

  Object.defineProperty(bodyScrollEl, 'offsetHeight', {
    get: function get() {
      return window.innerHeight;
    }
  });

  var scrollSpyContext = '@@scrollSpyContext';
  var scrollSpyElements = {};
  var scrollSpySections = {};
  var activeElement = {};
  var activableElements = {};
  var currentIndex = {};

  options = Object.assign({
    allowNoActive: false,
    data: null,
    active: {
      selector: null,
      class: 'active'
    },
    link: {
      selector: 'a'
    }
  }, options || {});

  function findElements(container, selector) {
    if (!selector) {
      return container.children;
    }

    var id = scrollSpyId(container);

    var elements = [];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = container.querySelectorAll(selector)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var el = _step.value;

        // Filter out elements that are owned by another directive
        if (scrollSpyIdFromAncestors(el) === id) {
          elements.push(el);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return elements;
  }

  function scrollSpyId(el) {
    return el.getAttribute('data-scroll-spy-id') || el.getAttribute('scroll-spy-id') || 'default';
  }

  function scrollSpyIdDefined(el) {
    return !!el.getAttribute('data-scroll-spy-id') || !!el.getAttribute('scroll-spy-id');
  }

  function scrollSpyIdFromAncestors(el) {
    do {
      if (scrollSpyIdDefined(el)) {
        return scrollSpyId(el);
      }
      el = el.parentElement;
    } while (el);
    return 'default';
  }

  function initScrollSections(el, selector) {
    var id = scrollSpyId(el);
    var idScrollSections = findElements(el, selector);
    scrollSpySections[id] = idScrollSections;

    if (idScrollSections[0] && idScrollSections[0].offsetParent !== el) {
      el[scrollSpyContext].eventEl = window;
      el[scrollSpyContext].scrollEl = bodyScrollEl;
    }
  }

  function getOffsetTop(elem, untilParent) {
    var offsetTop = 0;
    do {
      if (!isNaN(elem.offsetTop)) {
        offsetTop += elem.offsetTop;
      }
      elem = elem.offsetParent;
    } while (elem && elem !== untilParent);
    return offsetTop;
  }

  function scrollTo(el, index) {
    var id = scrollSpyId(el);
    var idScrollSections = scrollSpySections[id];

    var scrollEl = el[scrollSpyContext].scrollEl;

    var current = scrollEl.scrollTop;

    if (idScrollSections[index]) {
      var target = getOffsetTop(idScrollSections[index]);
      var time = 200;
      var steps = 30;
      var timems = parseInt(time / steps);
      var gap = target - current;

      var _loop = function _loop(i) {
        var pos = current + gap / steps * i;
        setTimeout(function () {
          scrollEl.scrollTop = pos;
        }, timems * i);
      };

      for (var i = 0; i <= steps; i++) {
        _loop(i);
      }
    }
  }

  Vue.directive('scroll-spy', {
    bind: function bind(el, binding, vnode) {
      function onScroll() {
        var id = scrollSpyId(el);
        var idScrollSections = scrollSpySections[id];

        var _el$scrollSpyContext = el[scrollSpyContext],
            scrollEl = _el$scrollSpyContext.scrollEl,
            options = _el$scrollSpyContext.options;


        var index = void 0;

        if (scrollEl.offsetHeight + scrollEl.scrollTop >= scrollEl.scrollHeight - 10) {
          index = idScrollSections.length;
        } else {
          for (index = 0; index < idScrollSections.length; index++) {
            if (getOffsetTop(idScrollSections[index], scrollEl) > scrollEl.scrollTop) {
              break;
            }
          }
        }

        index = index - 1;

        if (index < 0) {
          index = options.allowNoActive ? null : 0;
        } else if (options.allowNoActive && index >= idScrollSections.length - 1 && getOffsetTop(idScrollSections[index]) + idScrollSections[index].offsetHeight < scrollEl.scrollTop) {
          index = null;
        }

        if (index !== currentIndex[id]) {
          var idActiveElement = activeElement[id];
          if (idActiveElement) {
            idActiveElement.classList.remove('active');
            activeElement[id] = null;
          }

          currentIndex[id] = index;
          if (typeof currentIndex !== 'undefined') {
            idActiveElement = activableElements[id][currentIndex[id]];
            activeElement[id] = idActiveElement;

            if (idActiveElement) {
              idActiveElement.classList.add('active');
            }
          }

          if (options.data) {
            Vue.set(vnode.context, options.data, index);
          }
        }
      }

      vnode.context.$scrollTo = scrollTo.bind(null, el);

      var id = scrollSpyId(el);

      el[scrollSpyContext] = {
        onScroll: onScroll,
        options: Object.assign({}, options, binding.value),
        id: scrollSpyId(el),
        eventEl: el,
        scrollEl: el
      };

      scrollSpyElements[id] = el;
    },
    inserted: function inserted(el) {
      initScrollSections(el);

      var _el$scrollSpyContext2 = el[scrollSpyContext],
          eventEl = _el$scrollSpyContext2.eventEl,
          onScroll = _el$scrollSpyContext2.onScroll;

      eventEl.addEventListener('scroll', onScroll);

      onScroll();
    },
    componentUpdated: function componentUpdated(el) {
      initScrollSections(el);

      var onScroll = el[scrollSpyContext].onScroll;


      onScroll();
    },
    unbind: function unbind(el) {
      var _el$scrollSpyContext3 = el[scrollSpyContext],
          eventEl = _el$scrollSpyContext3.eventEl,
          onScroll = _el$scrollSpyContext3.onScroll;

      eventEl.removeEventListener('scroll', onScroll);
    }
  });

  Vue.directive('scroll-spy-active', {
    inserted: function inserted(el, binding) {
      var activeOptions = Object.assign({}, options.active, binding.value);
      initScrollActive(el, activeOptions.selector);
    },
    componentUpdated: function componentUpdated(el, binding) {
      var activeOptions = Object.assign({}, options.active, binding.value);
      initScrollActive(el, activeOptions.selector);
    }
  });

  function initScrollActive(el, selector) {
    var id = scrollSpyId(el);
    activableElements[id] = findElements(el, selector);
  }

  function scrollLinkClickHandler(index, scrollSpyId, event) {
    scrollTo(scrollSpyElements[scrollSpyId], index);
  }

  function initScrollLink(el, selector) {
    var id = scrollSpyId(el);

    var linkElements = findElements(el, selector);

    for (var i = 0; i < linkElements.length; i++) {
      var linkElement = linkElements[i];

      var listener = scrollLinkClickHandler.bind(null, i, id);
      if (!linkElement[scrollSpyContext]) {
        linkElement[scrollSpyContext] = {};
      }

      if (!linkElement[scrollSpyContext].click) {
        linkElement.addEventListener('click', listener);
        linkElement[scrollSpyContext].click = listener;
      }
    }
  }

  Vue.directive('scroll-spy-link', {
    inserted: function inserted(el, binding) {
      var linkOptions = Object.assign({}, options.link, binding.value);
      initScrollLink(el, linkOptions.selector);
    },
    componentUpdated: function componentUpdated(el, binding) {
      var linkOptions = Object.assign({}, options.link, binding.value);
      initScrollLink(el, linkOptions.selector);
    },
    unbind: function unbind(el) {
      var linkElements = findElements(el);

      for (var i = 0; i < linkElements.length; i++) {
        var linkElement = linkElements[i];
        var id = scrollSpyId(el);
        var listener = scrollLinkClickHandler.bind(null, i, id);
        if (!linkElement[scrollSpyContext]) {
          linkElement[scrollSpyContext] = {};
        }

        if (linkElement[scrollSpyContext].click) {
          linkElement.removeEventListener('click', listener);
          delete linkElement[scrollSpyContext]['click'];
        }
      }
    }
  });
}
