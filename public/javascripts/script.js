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
    return this._formatContacts(contacts);
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

  setupTemplate: function (templateId) {
    let html = this.getElement(templateId).innerHTML;
    let template = Handlebars.compile(html);
    return template;
  },

  render: function (view) {
    let app = this.getElement('#root');
    app.innerHTML = '';
    app.append(view);
  },

  setUpContactsView: function (contacts) {
    let contactList = this.createElement("ul", "contacts-list");

    if (contacts.length === 0) {
      let noContactsMessage = this.createElement('p');
      noContactsMessage.textContent = "There are no contacts";
      contactList.append(noContactsMessage);
    } else {
      let contactTemplate = this.setupTemplate("#contactCard");
      contactList.innerHTML = contactTemplate({contacts:contacts});
      contactList.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-contact")) {
          //deleteContact(event.target.parentNode);
          console.log("delete was pushed");
        } else if (event.target.classList.contains("edit-contact")) {
          //let contactId = event.target.parentNode.dataset.contactId;
          //contactForm(Number(contactId));
          console.log("edit was pushed");
        } else if (event.target.classList.contains("tag")) {
          // event.preventDefault();
          // let tag = event.target.textContent;
          // filterByTag(tag);
          console.log("tag was clicked");
        }
      });
    }

    this.render(contactList);
  }
};

let controller = {
  contacts: [], //arr of contacts formatted with tags as an array of strings

  displayContacts: async function () {
    this.contacts = await model.getContacts();
    view.setUpContactsView(this.contacts);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  controller.displayContacts();
});