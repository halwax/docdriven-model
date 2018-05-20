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
              ]
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
            }
          ],
          mReferences: [
            {
              source: 'model.domain.person.Person',
              target: 'model.domain.person.Address',
              sourceLabel: 'person',
              targetLabel: 'addresses : 0..*'
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

