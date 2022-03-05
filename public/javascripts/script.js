let model = {

  getContacts: async function () {
    let contacts = await fetch('api/contacts', {
      method: 'GET'
    }).then(res => {
      return res.json();
    }).catch(() => alert('can\'t get contacts'));
    return contacts;
  },

  addContact: async function (data) {
    await fetch('api/contacts', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then()
      .catch(() => alert('can\'t add contact'));
  },

  editContact: async function (contactId, data) {
    await fetch(`/api/contacts/${contactId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then()
      .catch(() => alert('can\'t edit contact'));
  },

  deleteContact: async function (contactId) {
    await fetch(`/api/contacts/${contactId}`, {
      method: "DELETE",
    }).then()
      .catch(() => alert('can\'t delete contact'));
  }
};

let view = {
  _getElement: function (selector, ancestorElement) {
    let element;
    if (ancestorElement) {
      element = ancestorElement.querySelector(selector);
    } else {
      element = document.querySelector(selector);
    }
    return element;
  },

  _createElement: function (tag, classNames) {
    let element = document.createElement(tag);
    if (classNames) {
      classNames.split(" ").forEach(className => {
        element.classList.add(className);
      });
    }
    return element;
  },

  _setupTemplate: function (templateId) {
    let html = view._getElement(templateId).innerHTML;
    let template = Handlebars.compile(html);
    return template;
  },

  _render: function (view) {
    let app = this._getElement('#root');
    app.innerHTML = '';
    app.append(view);
  },

  _setUpNewContactForm: function () {
    let formTemplate = view._setupTemplate("#contact-form");
    let div = view._createElement("div", "contact-to-create");
    div.innerHTML = formTemplate({
      full_name: '',
      email: '',
      phone_number: '',
      id: ''
    });

    view._render(div);
  },

  _setUpExistingContactForm: function (existingContactData) {
    let formTemplate = view._setupTemplate("#contact-form");
    let div = view._createElement("div", "contact-to-edit");
    div.innerHTML = formTemplate(existingContactData);

    view._render(div);
  },

  _setUpZeroContactsView: function () {
    let div = view._createElement('div', "no-contacts-at-all");
    let zeroContactsTemplate = view.setupTemplate("#no-contacts");
    div.innerHTML = zeroContactsTemplate();

    view._render(div);
  },

  _filterContactsByTag: function (tag) {
    let cards = document.querySelectorAll(".card");
    let cardsArr = Array.prototype.slice.call(cards);
  
    cardsArr.forEach(card => {
      let cardTags = Array.prototype.slice.call(card.querySelectorAll('.tag')).map(tag => {
        return tag.textContent;
      });
      if (!cardTags.includes(tag)) {
        card.classList.toggle('hide', true);
      }
    });
  },

  _filterContactsByFullName: function (event) {
    let value = event.target.value;
    let cards = document.querySelectorAll(".card");
    let cardsArr = Array.prototype.slice.call(cards);

    cardsArr.forEach(card => {
      if (value === "") {
        card.classList.toggle('hide', false);
      } else {
        let name = card.querySelector('h3').textContent;
        let includes = value;
        if (!name.match(new RegExp(includes))) {
          card.classList.toggle('hide', true);
        }
      }
    });
  },

  setUpContactsView: function (contacts) {
    let contactList = view._createElement("ul", "contacts-list");

    let contactTemplate = view._setupTemplate("#contact-card");
    contactList.innerHTML = contactTemplate({contacts:contacts});

    view._render(contactList);
  }
};

let controller = {
  contacts: [], //arr of contacts formatted with tags as an array of strings

  _setUpMainBarEvents: function () {
    let mainBar = view._getElement(".row-well");
    let addContactBtn = view._getElement(".btn-add-contact", mainBar);
    let searchInput = view._getElement(".contact-name-search");

    addContactBtn.addEventListener("click", () => {
      view._setUpNewContactForm();
      controller._newContactFormEventListeners();
    });
    searchInput.addEventListener("input", view._filterContactsByFullName);
  },

  _formatAllContactTagsToArray: function (contacts) { //splits tags string into array of tags
    contacts.forEach(contact => {
      if (contact["tags"]) {
        contact["tags"] = contact["tags"].split(',');
      }
    });
    return contacts;
  },

  _formatTagsToDisplayString: function (contact) {
    let newFormattedContactData = {...contact};
    if (newFormattedContactData.tags) { 
      newFormattedContactData.tags = newFormattedContactData.tags.join(', ') + ', ...';
    }
    return newFormattedContactData;
  },

  _formatTagsToServerString: function (dataObject) {
    let serverTagString = dataObject["tags"].split(',').map(tag => {
      return tag.trim();
    });
    dataObject["tags"] = serverTagString.join(',');
    return dataObject;
  },
  _removeId: function (dataObj) {
    delete dataObj.id;
    return dataObj;
  },

  _formDataToJSON: function(formData) {
    let json = {};
    for (const pair of formData.entries()) {
      json[pair[0]] = pair[1];
    }

    return json;
  },

  _sanitizeObject: function (object) {
    let keys = Object.keys(object);
    let newObj = {};
    keys.forEach(key => {
      if (object[key] !== '') {
        newObj[key] = object[key];
      }
    });
    return newObj;
  },

  _contactsEventListeners: function () {
    let contactList = view._getElement(".contacts-list");
    
    contactList.addEventListener("click", (event) => {
      if (event.target.classList.contains("delete-contact")) {
        let message = confirm('Are you sure you want to delete this contact?');
        if (!message) return;
        let contactId = event.target.parentNode.dataset.contactId;
        controller.deleteContact(contactId);
      } else if (event.target.classList.contains("edit-contact")) {
        let contactId = event.target.parentNode.dataset.contactId;
        let contactData = controller.formContactData(contactId);
        view._setUpExistingContactForm(contactData);
        controller._existingContactFormEventListeners();
      } else if (event.target.classList.contains("tag")) {
        event.preventDefault();
        let tag = event.target.textContent;
        view._filterContactsByTag(tag);
      }
    });
  },

  _newContactFormEventListeners: function () {
    let div = view._getElement(".contact-to-create");
    let cancelButton = view._getElement('.btn-close-form', div);

    div.addEventListener("submit", controller.submitNewContact);
    cancelButton.addEventListener('click', controller.cancelForm);
  },

  _existingContactFormEventListeners: function () {
    let div = view._getElement(".contact-to-edit");
    let cancelButton = view._getElement('.btn-close-form', div);

    div.addEventListener("submit", controller.submitContactEdits);
    cancelButton.addEventListener('click', controller.cancelForm);
  },

  displayContacts: async function () {
    controller.contacts = null;
    let contactsData = await model.getContacts();
    controller.contacts = this._formatAllContactTagsToArray(contactsData);

    if (controller.contacts.length > 0) {
      view.setUpContactsView(controller.contacts);
      controller._contactsEventListeners();
    } else {
      view._setUpZeroContactsView();
      controller.ZeroContactsEventListener();
    }

  },

  formContactData: function (contactId) {
    let contactData = controller.contacts.filter(contact => String(contact["id"]) === contactId)[0];
    return controller._formatTagsToDisplayString(contactData);
  },

  submitNewContact: function (event) {
    event.preventDefault();
    let form = view._getElement("form");
    let formData = new FormData(form);
    let jsonData = controller._formDataToJSON(formData);
    let tagsFormattedData = controller._formatTagsToServerString(jsonData);
    let idRemovedFromData = controller._removeId(tagsFormattedData);
    
    model.addContact(idRemovedFromData);
    controller.displayContacts();
  },

  submitContactEdits: function (event) {
    event.preventDefault();

    let form = view._getElement("form");
    let contactId = form.id;
    let formData = new FormData(form);
    let jsonData = controller._formDataToJSON(formData);
    let tagsFormattedData = controller._formatTagsToServerString(jsonData);
    let newData = controller._sanitizeObject(tagsFormattedData);

    model.editContact(contactId, newData);
    controller.displayContacts();
  },

  deleteContact: function (contactId) {
    model.deleteContact(contactId);
    controller.displayContacts();
  },

  cancelForm: function (event) {
    event.preventDefault();
    controller.displayContacts();
  },

  zeroContactsEventListener: function () {
    let div = view._getElement(".no-contacts-at-all");
    div.addEventListener("click", (event) => {
      if (event.target.classList.contains("btn-add-contact")) {
        console.log('add contact button pressed');
        view._setUpNewContactForm();
        controller._newContactFormEventListeners();
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  controller._setUpMainBarEvents();
  controller.displayContacts();
});