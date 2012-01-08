/*
 * Copyright 2009 Network Engine for Objects in Lund AB [neotechnology.com] This
 * program is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version. This program is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
 * General Public License for more details. You should have received a copy of
 * the GNU Affero General Public License along with this program. If not, see
 * <http://www.gnu.org/licenses/>.
 */

/**
 * Neo4j wrapper for JavaScript
 * 
 * @author Anders Nawroth
 */
Neo4js = new function()
{
	var Neo4js = this;

	// import Java classes into the namespace

	var EmbeddedNeo = Packages.org.neo4j.api.core.EmbeddedNeo;
	var NeoServiceLifecycle = Packages.org.neo4j.util.NeoServiceLifecycle;

	var RelationshipType = Packages.org.neo4j.api.core.RelationshipType;

	var Direction = Packages.org.neo4j.api.core.Direction;
	var Order = Packages.org.neo4j.api.core.Traverser.Order;
	var StopEvaluator = Packages.org.neo4j.api.core.StopEvaluator;
	var ReturnableEvaluator = Packages.org.neo4j.api.core.ReturnableEvaluator;

	this.createService = function( location, withIndexing )
	{
		var neo = new EmbeddedNeo( location );
		var wrappedNeo = new NeoService( neo );
		var index = null;
		var neoLifecycle = new NeoServiceLifecycle( neo );
		if ( withIndexing )
		{
			neoLifecycle.addLuceneIndexService();
			index = neoLifecycle.indexService();
		}
		var service =
		{
			shutdown : function()
			{
				neoLifecycle.manualShutdown();
			},
			neoService : function()
			{
				return wrappedNeo;
			},
			indexService : function()
			{
				return neoLifecycle.indexService();
			},
			transaction : function( func )
			{
				var tx = neo.beginTx();
				try
				{
					var result = func( wrappedNeo, index );
					tx.success();
					return result;
				}
				finally
				{
					tx.finish();
				}
			}
		};
		return service;
	};
	
	this.nodeWrapper = function( typeRepository, spec )
	{
		var node = spec.node;
		var that = {"node": node};
		
		if ( spec["properties"] )
		{
			spec["properties"].forEach( function( property )
					{
						that[property] = function( value )
						{
							if ( arguments.length === 1 )
							{
								return node.$( property, value );
							}
							else
							{
								return node.$( property );
							}
						};
					});
		}
		if ( spec["out"] )
		{
			spec["out"].forEach( function( outRel )
					{
						that[outRel] = function( otherNode )
						{
							if ( arguments.length === 1 )
							{
								node._.to( otherNode.node, outRel );
							}
							else
							{
								return node._.outgoing( outRel );
							}
						};
					});
		}
		if ( spec["in"] )
		{
			spec["in"].forEach( function( inRel )
					{
						that[inRel] = function( otherNode )
						{
							return node._.incoming( inRel );
						};
					});
		}
		if ( spec["both"] )
		{
			spec["both"].forEach( function( bothRel )
					{
						that[bothRel] = function( otherNode )
						{
							if ( arguments.length === 1 )
							{
								node._.to( otherNode.node, bothRel );
							}
							else
							{
								return wrappedNodeIterator( function()
								{
									for ( var rel in node._( bothRel ) )
									{
										var otherNode = rel.getOtherNode( node );
										yield( otherNode );
									}
								});
							}
						};
					});
		}
		return that;
	};
	
	function PropertyContainer( container )
	{
		var underlying = container;
		var thisPropertyContainer = this;
		this.getUnderlying = function()
		{
			return underlying;
		};
		this.hasProperty = function( key )
		{
			return underlying.hasProperty( key );
		};
		this.removeProperty = function( key )
		{
			return underlying.removeProperty( key );
		};
		this.getPropertyKeys = function()
		{
			return Iterator( underlying.getPropertyKeys() );
		};
		this.$ = function( key, value )
		{
			if ( arguments.length == 0 )
			{
				return this.$.__iterator__( false );
			}
			else if ( arguments.length == 2 )
			{
				underlying.setProperty( key, value );
				return thisPropertyContainer.$;
			}
			else
			{
				return underlying.getProperty( key );
			}
		};
		this.$.__iterator__ = function( onlyKeys )
		{
			if ( onlyKeys )
			{
				for ( var key in Iterator( underlying.getPropertyKeys() ) )
				{
					yield( key );
				}
			}
			else
			{
				for ( var key in Iterator( underlying.getPropertyKeys() ) )
				{
					yield( [ key, underlying.getProperty( key ) ] );
				}
			}
		};
		this.$.__noSuchMethod__ = function( key, args )
		{
			if ( args.length == 1 )
			{
				return thisPropertyContainer.$( key, args[0] );
			}
			else
			{
				return thisPropertyContainer.$( key );
			}
		};
		this.getId = function()
		{
			return underlying.getId().toString();
		};
		this.toString = function()
		{
			return underlying.toString();
		};
		this.del = function()
		{
			underlying["delete"]();
		};
	}

	this.Node = function( underlying )
	{
		PropertyContainer.call( this, underlying );
		var thisNode = this;
		this.createRelationshipTo = function( node, type )
		{
			var targetNode = node.getUnderlying();
			var rel = underlying.createRelationshipTo( targetNode, dynamicRelationshipType( type ) );
			return new Neo4js.Relationship( rel );
		};
		this._ = function()
		{
			if ( arguments.length > 0 )
			{
				var a = java.lang.reflect.Array.newInstance( org.neo4j.api.core.RelationshipType,
						arguments.length );
				for ( var i = arguments.length - 1; i >= 0; --i )
				{
					a[i] = dynamicRelationshipType( arguments[i] );
				}
				return wrappedRelationshipIterator( underlying.getRelationships( a ) );
			}
			return wrappedRelationshipIterator( underlying.getRelationships() );
		};
		this._.to = function( node, type )
		{
			return thisNode.createRelationshipTo( node, type );
		};
		this._.single = function( type )
		{
			return new Neo4js.Relationship( underlying.getSingleRelationship(
					dynamicRelationshipType( type ), Direction.BOTH ) );
		};
		this._.singleOutgoing = function( type )
		{
			return new Neo4js.Relationship( underlying.getSingleRelationship(
					dynamicRelationshipType( type ), Direction.OUTGOING ) );
		};
		this._.singleIncoming = function( type )
		{
			return new Neo4js.Relationship( underlying.getSingleRelationship(
					dynamicRelationshipType( type ), Direction.INCOMING ) );
		};
		this._.__iterator__ = function()
		{
			for ( var rel in Iterator( underlying.getRelationships() ) )
			{
				yield( new Neo4js.Relationship( rel ) );
			}
		};
		this._.outgoing = createDirectedWrapper( Direction.OUTGOING );
		this._.outgoing.__iterator__ = function()
		{
			for ( var rel in Iterator( underlying.getRelationships( Direction.OUTGOING ) ) )
			{
				yield( new Neo4js.Relationship( rel ) );
			}
		};
		this._.incoming = createDirectedWrapper( Direction.INCOMING );
		this._.incoming.__iterator__ = function()
		{
			for ( var rel in Iterator( underlying.getRelationships( Direction.INCOMING ) ) )
			{
				yield( new Neo4js.Relationship( rel ) );
			}
		};

		this.traverse = function()
		{
			return new Neo4js.Traverser( thisNode );
		};

		function createDirectedWrapper( direction )
		{
			return function()
			{
				if ( arguments.length > 0 ) { return wrappedDirectedRelationshipIterator(
						underlying, arguments, direction ); }
				return wrappedRelationshipIterator( underlying.getRelationships( direction ) );
			};
		}
	};

	this.Node.prototype = new PropertyContainer;

	this.Relationship = function( underlying )
	{
		PropertyContainer.call( this, underlying );
		this.getType = function()
		{
			return underlying.getType().name();
		};
		this.getEndNode = function()
		{
			return new Neo4js.Node( underlying.getEndNode() );
		};
		this.getOtherNode = function( node )
		{
			return new Neo4js.Node( underlying.getOtherNode( node ) );
		};
		this.isType = function( type )
		{
			return type == this.getType();
		};

	};

	this.Relationship.prototype = new PropertyContainer;

	function NeoService( neo )
	{
		this.getReferenceNode = function()
		{
			return new Neo4js.Node( neo.getReferenceNode() );
		};
		this.getNodeById = function( id )
		{
			return new Neo4js.Node( neo.getNodeById( id ) );
		};
		this.createNode = function()
		{
			return new Neo4js.Node( neo.createNode() );
		};
		this.getAllNodes = function()
		{
			return wrappedNodeIterator( neo.getAllNodes() );
		};
	}

	var reltypes = {};

	function dynamicRelationshipType( name )
	{
		if ( name == null ) { throw "A relationship type cannot have a null name"; }

		if ( reltypes[name] ) { return reltypes[name]; }

		type = new RelationshipType(
		{
			name : function()
			{
				return name;
			}
		} );
		reltypes[name] = type;
		return type;
	}

	this.TraversalPosition = function( position )
	{
		this.previousNode = function()
		{
			return new Neo4js.Node( position.previousNode() );
		};
		this.depth = position.depth();
		this.isStartNode = function()
		{
			return position.isStartNode();
		};
		this.notStartNode = function()
		{
			return position.notStartNode();
		};
		this.lastRelationshipTraversed = function()
		{
			var rel = position.lastRelationshipTraversed();
			if ( rel == null ) { return null; }
			return new Neo4js.Relationship( rel );
		};
		this.returnedNodesCount = position.returnedNodesCount();
	}

	this.Traverser = function( startNode )
	{
		var startingNode = startNode;
		var thisTraverser = this;
		var order = Order.BREADTH_FIRST;
		var stopEval = StopEvaluator.DEPTH_ONE;
		var returnEval = ReturnableEvaluator.ALL_BUT_START_NODE;
		var undirectedTypes = [], inTypes = [], outTypes = [];

		this.start = function( startNode )
		{
			startingNode = startNode;
			return thisTraverser;
		};

		this.breadthFirst = function()
		{
			order = Order.BREADTH_FIRST;
			return thisTraverser;
		};
		this.depthFirst = function()
		{
			order = Order.DEPTH_FIRST;
			return thisTraverser;
		};

		this.outgoing = function()
		{
			addTypeStrings( arguments, outTypes );
			return thisTraverser;
		};
		this.incoming = function()
		{
			addTypeStrings( arguments, inTypes );
			return thisTraverser;
		};
		this.undirected = function()
		{
			addTypeStrings( arguments, undirectedTypes );
			return thisTraverser;
		};

		function addTypeStrings( strings, target )
		{
			for ( var i = strings.length - 1; i >= 0; --i )
			{
				target.push( strings[i] );
			}
		}

		this.depth = function( depth )
		{
			stopEval = new StopEvaluator( createDepthStopEvaluator(
			{
				isStopNode : function( currentPos )
				{
					return currentPos.depth() >= depth;
				}
			} ) );
			return thisTraverser;
		};
		this.stopNode = function( stopEvaluator )
		{
			stopEval = new StopEvaluator(
			{
				isStopNode : function( position )
				{
					return stopEvaluator.call( stopEvaluator, new Neo4js.Node( position
							.currentNode() ), new Neo4js.TraversalPosition( position ) )
				}
			} );
			return thisTraverser;
		};
		this.untilEndOfGraph = function()
		{
			stopEval = StopEvaluator.END_OF_GRAPH;
			return thisTraverser;
		};

		this.returnAll = function()
		{
			returnEval = ReturnableEvaluator.ALL;
			return thisTraverser;
		};
		this.returnAllButStartNode = function()
		{
			returnEval = ReturnableEvaluator.ALL_BUT_START_NODE;
			return thisTraverser;
		};
		this.returnNode = function( returnEvaluator )
		{
			returnEval = new ReturnableEvaluator(
			{
				isReturnableNode : function( position )
				{
					return returnEvaluator.call( returnEvaluator, new Neo4js.Node( position
							.currentNode() ), new Neo4js.TraversalPosition( position ) )
				}
			} );
			return thisTraverser;
		};

		this.__iterator__ = function( onlyKeys )
		{
			var numTypes = undirectedTypes.length + inTypes.length + outTypes.length;
			var typesAndDirections = java.lang.reflect.Array.newInstance( java.lang.Object,
					numTypes * 2 );
			var index = 0;
			addTypes( undirectedTypes, Direction.BOTH );
			addTypes( inTypes, Direction.INCOMING );
			addTypes( outTypes, Direction.OUTGOING );

			var traverser = startingNode.getUnderlying().traverse( order, stopEval, returnEval,
					typesAndDirections );

			if ( onlyKeys )
			{
				for ( var node in Iterator( traverser ) )
				{
					yield( new Neo4js.Node( node ) );
				}
			}
			else
			{
				for ( var node in Iterator( traverser ) )
				{
					yield( [ new Neo4js.Node( node ),
							new Neo4js.TraversalPosition( traverser.currentPosition() ) ] );
				}
			}

			function addTypes( source, direction )
			{
				source.forEach( function( type )
				{
					typesAndDirections[index++] = dynamicRelationshipType( type );
					typesAndDirections[index++] = direction;
				} );
			}
		};

		function createDepthStopEvaluator( depth )
		{
			return
			{
				isStopNode : function( currentPos )
				{
					return currentPos.depth() >= depth;
				}
			};
		}
	}

	function wrappedRelationshipIterator( source )
	{
		return Iterator(
		{
			__iterator__ : function()
			{
				for ( var rel in Iterator( source ) )
				{
					yield( new Neo4js.Relationship( rel ) );
				}
			}
		} );
	}

	function wrappedNodeIterator( source )
	{
		return Iterator(
		{
			__iterator__ : function()
			{
				for ( var node in Iterator( source ) )
				{
					yield( new Neo4js.Node( node ) );
				}
			}
		} );
	}

	function wrappedDirectedRelationshipIterator( node, reltypes, direction )
	{
		return Iterator(
		{
			__iterator__ : function()
			{
				for ( var i = reltypes.length - 1; i >= 0; --i )
				{
					for ( var rel in Iterator( node.getRelationships(
							dynamicRelationshipType( reltypes[i] ), direction ) ) )
					{
						yield( new Neo4js.Relationship( rel ) );
					}
				}
			}
		} );
	}
}();
