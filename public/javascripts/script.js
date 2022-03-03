let model = {
  _formatContacts: function (contacts) { //splits tags string into array of tags
    contacts.forEach(contact => {
      if (contact["tags"]) {
        contact["tags"] = contact["tags"].split(',');
      }
    });
    return contacts;
  },

  getContacts: async function () {
    let contacts = await fetch('api/contacts', {
      method: 'GET'
    }).then(res => {
      return res.json();
    }).catch(() => alert('can\'t get contacts'));
    return model._formatContacts(contacts);
  }
};

let view = {
  getElement: function (selector, ancestorElement) {
    let element;
    if (ancestorElement) {
      element = ancestorElement.querySelector(selector);
    } else {
      element = document.querySelector(selector);
    }
    return element;
  },

  createElement: function (tag, classNames) {
    let element = document.createElement(tag);
    if (classNames) {
      classNames.split(" ").forEach(className => {
        element.classList.add(className);
      });
    }
    return element;
  },

  _setupTemplate: function (templateId) {
    let html = view.getElement(templateId).innerHTML;
    let template = Handlebars.compile(html);
    return template;
  },

  render: function (view) {
    let app = this.getElement('#root');
    app.innerHTML = '';
    app.append(view);
  },

  _setUpNewContactForm: function () {
    let formTemplate = view._setupTemplate("#contact-form");
    let div = view.createElement("div");
    div.innerHTML = formTemplate({
      full_name: '',
      email: '',
      phone_number: ''
    });

    view.render(div);
  },

  _setUpExistingContactForm: function (existingId) {
    let formTemplate = view._setupTemplate("#contact-form");
    let div = view.createElement("div");
    let existingContactData = controller.formContactData(existingId);
    div.innerHTML = formTemplate(existingContactData);
    
    view.render(div);
  },

  _setUpZeroContactsView: function () {
    let div = view.createElement('div');
    let zeroContactsTemplate = view.setupTemplate("#no-contacts");
    div.innerHTML = zeroContactsTemplate();
    div.addEventListener("click", (event) => {
      if (event.target.classList.contains("btn-add-contact")) {
        console.log('add contact button pressed');
        view._setUpNewContactForm();
      }
    });

    view.render(div);
  },

  setUpMainBarEvents: function () {
    let mainBar = view.getElement(".row-well");
    let addContactBtn = view.getElement(".btn-add-contact", mainBar);

    addContactBtn.addEventListener("click", view._setUpNewContactForm);
  },

  setUpContactsView: function (contacts) {
    let contactList = view.createElement("ul", "contacts-list");

    if (contacts.length === 0) {
      view._setUpZeroContactsView();
    } else {
      let contactTemplate = view._setupTemplate("#contactCard");
      contactList.innerHTML = contactTemplate({contacts:contacts});
      contactList.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-contact")) {
          //deleteContact(event.target.parentNode);
          console.log("delete was pushed");
        } else if (event.target.classList.contains("edit-contact")) {
          let contactId = event.target.parentNode.dataset.contactId;
          view._setUpExistingContactForm(contactId);
        } else if (event.target.classList.contains("tag")) {
          // event.preventDefault();
          // let tag = event.target.textContent;
          // filterByTag(tag);
          console.log("tag was clicked");
        }
      });
    }

    view.render(contactList);
  }
};

let controller = {
  contacts: [], //arr of contacts formatted with tags as an array of strings

  _formatTagsToDisplayString: function (contact) {
    let newFormattedContactData = {...contact};
    if (newFormattedContactData.tags) {  //does this need a second case for a blank string??? Maybe swap space for null in submittal
      newFormattedContactData.tags = newFormattedContactData.tags.join(', ') + ', ...';
    }
    return newFormattedContactData;
  },

  displayContacts: async function () {
    controller.contacts = await model.getContacts();
    view.setUpContactsView(controller.contacts);
  },

  formContactData: function (contactId) {
    let contactData = controller.contacts.filter(contact => String(contact["id"]) === contactId)[0];
    return controller._formatTagsToDisplayString(contactData);
  }

};

document.addEventListener('DOMContentLoaded', () => {
  view.setUpMainBarEvents();
  controller.displayContacts();
});