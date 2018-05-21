var model = {
  path: 'model',
  name: 'model',
  qualifiedName: 'model',
  mPackages: [
    {
      path: 'model.domain',
      name: 'domain',
      qualifiedName: 'model.domain',
      mPackages: [
        {
          path: 'model.domain.person',
          name: 'person',
          qualifiedName: 'model.domain.person',
          mClasses: [
            {
              path: 'model.domain.person.Person',
              name: 'Person',
              mAttributes: [
                {
                  name: 'firstName',
                  typeName: 'String'
                },
                {
                  name: 'lastName',
                  typeName: 'String'
                }
              ],
              sql: 'CREATE TABLE PERSON'
            },
            {
              path: 'model.domain.person.Address',
              name: 'Address',
              mAttributes: [
                {
                  name: 'street',
                  typeName: 'String'
                }
              ]
            },
            {
              path: 'model.domain.person.Partner',
              name: 'Partner',
              mAttributes: [
                {
                  name: 'type',
                  typeName: 'String'
                }
              ]
            },
            {
              path: 'model.core.Date',
              name: 'Date'
            }
          ],
          mReferences: [
            {
              source: 'model.domain.person.Person',
              target: 'model.domain.person.Address',
              sourceLabel: 'person',
              targetLabel: 'addresses : 0..*'
            },
            {
              source: 'model.domain.person.Person',
              target: 'model.domain.person.Partner',
              sourceLabel: 'person',
              targetLabel: 'partner : 0..1'
            },
            {
              source: 'model.domain.person.Person',
              target: 'model.core.Date',
              sourceLabel: '',
              targetLabel: 'birthDate : 1'
            }
          ],
          mGeneralizations: [
            {
              source: 'model.domain.person.Partner',
              target: 'model.domain.person.Person'
            }
          ]
        }
      ]
    },
    {
      path: 'model.core',
      name: 'core',
      qualifiedName: 'model.core',
      mClasses: [
        {
          path: 'model.core.Date',
          name: 'Date',
          mAttributes: [
            {
              name: 'a',
              typeName: 'String'
            },
            {
              name: 'b',
              typeName: 'String'
            }
          ]
        }
      ]
    }
  ]
};

