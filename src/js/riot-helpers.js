import riot from 'riot';

const _GlobalEvents = {
  observable: riot.observable()
};

export const Events = {
  trigger(eventName, arg) {
    _GlobalEvents.observable.trigger(eventName, arg);
  },

  on(eventName, cb) {
    _GlobalEvents.observable.on(eventName, (arg) => cb(arg));
  },
};

export function ShowException(ex) {
  let json = JSON.stringify(ex, Object.getOwnPropertyNames(ex), 2).replace(/\\n/g, '<br>');
  swal({
    type: 'error',
    title: 'Exception',
    animation: false,
    html: `<pre>${json}</pre>`
  });

  /* CSS: nb in index.html not app.tag.html
  .swal2-popup #swal2-content pre {
    text-align: left !important;
    font-size: 10px !important;
  }
  */
}

export function removeChildren(el) {
  // unmount any riot tags
  for (let child of el.children) {
    if (child._tag) {
      console.log('unmount ' + child.tagName);
      child._tag.unmount();
    }
  }

  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
