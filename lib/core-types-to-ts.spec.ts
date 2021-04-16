import { NamedType, NodeDocument } from 'core-types';
import { convertCoreTypesToTypeScript } from './core-types-to-ts'
import { convertTypeScriptToCoreTypes } from './ts-to-core-types';


const wrapDocument = ( types: Array< NamedType > ): NodeDocument =>
	( {
		version: 1,
		types
	} );

describe( "core-types-to-ts", ( ) =>
{
	it( "simple type", ( ) =>
	{
		const ts = convertCoreTypesToTypeScript( wrapDocument( [
			{
				name: 'foo',
				type: 'string',
			}
		] ) );
		expect( ts ).toMatchSnapshot( );
	} );

	it( "simple type as declaration", ( ) =>
	{
		const ts = convertCoreTypesToTypeScript( wrapDocument( [
			{
				name: 'foo',
				type: 'string',
			}
		] ), { declaration: true } );
		expect( ts ).toMatchSnapshot( );
	} );

	it( "simple string union type as declaration", ( ) =>
	{
		const ts = convertCoreTypesToTypeScript( wrapDocument( [
			{
				name: 'foo',
				type: 'string',
				enum: [ "foo", "bar", "baz" ],
			}
		] ), { declaration: true } );
		expect( ts ).toMatchSnapshot( );
	} );

	it( "simple string union of separate types", ( ) =>
	{
		const ts = convertCoreTypesToTypeScript( wrapDocument( [
			{
				name: 'bar',
				type: 'string',
				const: 'bar',
			},
			{
				name: 'foo',
				type: 'or',
				or: [
					{
						type: 'ref',
						ref: 'bar',
					},
					{
						type: 'string',
						enum: [ "foo", "baz" ],
					}
				]
			}
		] ) );
		expect( ts ).toMatchSnapshot( );
	} );

	it( "complex type", ( ) =>
	{
		const ts = convertCoreTypesToTypeScript( wrapDocument( [
			{
				name: 'foo',
				type: 'object',
				properties: {
					bar: { required: false, node: { type: 'string' } },
					baz: {
						required: true,
						node: {
							type: 'or',
							or: [
								{ type: 'number' },
								{
									type: 'object',
									properties: { },
									additionalProperties: { type: 'boolean' },
								}
							]
						},
					},
					bak: {
						required: true,
						node: {
							type: 'object',
							properties: { },
							additionalProperties: true,
						},
					},
					tupleWithAdditionals: {
						required: true,
						node: {
							type: 'tuple',
							elementTypes: [ { type: 'string' } ],
							additionalItems: { type: 'number' },
							minItems: 1,
						},
					},
					tupleWithObjectAdditionals: {
						required: true,
						node: {
							type: 'tuple',
							elementTypes: [ { type: 'string' } ],
							additionalItems: {
								type: 'object',
								properties: {
									x: {
										required: false,
										node: { type: 'ref', ref: 'User' }
									}
								},
								additionalProperties: false,
							},
							minItems: 1,
						},
					},
				},
				additionalProperties: false,
			}
		] ),
		{ declaration: true, useUnknown: true}
		);
		expect( ts ).toMatchSnapshot( );
	} );

	it( "used in readme", ( ) =>
	{
		const ts = convertCoreTypesToTypeScript( wrapDocument( [
			{
				name: 'User',
				title: 'User type',
				description:
					'This type holds the user information, such as name',
				type: 'object',
				properties: {
					name: {
						node: { type: 'string', title: 'The real name' },
						required: true
					},
				},
				additionalProperties: false,
			},
			{
				name: 'ChatLine',
				title: 'A chat line',
				type: 'object',
				properties: {
					user: {
						node: { type: 'ref', ref: 'User' }, required: true
					},
					line: { node: { type: 'string' }, required: true },
				},
				additionalProperties: false,
			},
		] ) );

		expect( ts ).toMatchSnapshot( );
	} );

	it( "should write annotations properly", ( ) =>
	{
		const ts = convertCoreTypesToTypeScript( wrapDocument( [
			{
				name: 'User',
				title: 'User type',
				description:
					'This type holds the user information, such as name',
				examples: [ '{ name: "Joe" }' ],
				default: '{ user: "" }',
				see: [ 'http://username' ],
				type: 'object',
				properties: {
					name: {
						node: {
							type: 'string',
							title: 'The real name',
							description: 'Must be a valid name, not */'
						},
						required: true
					},
				},
				additionalProperties: false,
			},
			{
				name: 'ChatLine',
				title: 'A chat line',
				type: 'object',
				properties: {
					user: {
						node: {
							title: 'User ref',
							type: 'ref',
							ref: 'User'
						},
						required: true,
					},
					line: {
						node: {
							examples: 'This is a line',
							type: 'string',
						},
						required: true
					},
				},
				additionalProperties: false,
			},
			{
				title: 'Thing ref',
				name: 'Thingy',
				type: 'or',
				or: [
					{
						type: 'ref',
						ref: 'Thing',
						title: 'Thing is the preferred type',
						see: 'The Thing documentation',
					},
					{
						type: 'number',
						title: 'Just a number',
					},
				],
			},
		] ) );

		expect( ts ).toMatchSnapshot( );
	} );

  it( "should be bidirectional", ( ) => {
    const ts = convertCoreTypesToTypeScript(
      wrapDocument([
        {
          name: "User",
          title: "User type",
          description: "This type holds the user information, such as name",
          type: "object",
          properties: {
            name: {
              node: { type: "string", title: "The real name" },
              required: true,
            },
          },
          additionalProperties: false,
        },
      ]),
      { noDescriptiveHeader: true }
    );

    const epi = convertCoreTypesToTypeScript(
      convertTypeScriptToCoreTypes(ts.data).data,
      { noDescriptiveHeader: true }
    );

    expect(epi).toEqual(ts);
  });

	it( "should not add descriptive header", ( ) =>
	{
		const ts = convertCoreTypesToTypeScript(
			wrapDocument( [
				{
					name: 'foo',
					type: 'string',
				}
			] ),
			{
				noDescriptiveHeader: true
			}
		);

		expect( ts.data ).toMatchSnapshot( );
	} );

	it( "should add user package", ( ) =>
	{
		const ts = convertCoreTypesToTypeScript(
			wrapDocument( [
				{
					name: 'foo',
					type: 'string',
				}
			] ),
			{
				userPackage: 'my-package',
				userPackageUrl: 'https://my-user-package.com',
			}
		);

		expect( ts.data ).toMatchSnapshot( );
	} );
} );
