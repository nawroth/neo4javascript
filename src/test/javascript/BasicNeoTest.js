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

function createNodeSpace()
{
    function doIt( neo )
    {
        var referenceNode = neo.getReferenceNode();

        var thomas = neo.createNode();
        thomas.$.name( "Thomas Andersson" ).age( 29 );

        referenceNode._.to( thomas, "ROOT" );

        var trinity = neo.createNode();
        trinity.$.name( "Trinity" );
        thomas._.to( trinity, "KNOWS" ).$.age( "3 days" );

        var morpheus = neo.createNode();
        morpheus.$.name( "Morpheus" ).rank( "Captain" ).occupation(
                "Total badass" );
        thomas._.to( morpheus, "KNOWS" );
        morpheus._.to( trinity, "KNOWS" ).$.age( "12 years" );

        var cypher = neo.createNode();
        cypher.$.name( "Cypher" );
        cypher.$( "last name", "Reagan" );
        morpheus._.to( cypher, "KNOWS" ).$.disclosure( "public" );

        var smith = neo.createNode();
        smith.$.name( "Agent Smith" ).version( "1.0b" ).language( "C++" );
        cypher._.to( smith, "KNOWS" ).$.disclosure( "secret" ).age( "6 months" );
        var architect = neo.createNode();
        architect.$.name( "The Architect" );
        smith._.to( architect, "CODED_BY" );
    }
    return service.transaction( doIt );
}

function neoName()
{
    return service.transaction( function( neo )
    {
        var neoNode = neo.getReferenceNode()._.single( "ROOT" ).getEndNode();
        return neoNode.$.name();
    } );
}

function neoAge()
{
    return service.transaction( function( neo )
    {
        var neoNode = neo.getReferenceNode()._.single( "ROOT" ).getEndNode();
        return neoNode.$.age();
    } );
}

function nodeInstanceTypeIsNode()
{
    return service.transaction( function( neo )
    {
        return neo.getReferenceNode() instanceof Neo4js.Node;
    } );
}

function nodeInstanceTypeIsNotRelationship()
{
    return service.transaction( function( neo )
    {
        return neo.getReferenceNode() instanceof Neo4js.Relationship;
    } );
}

function relationshipInstanceTypeIsNotNode()
{
    return service.transaction( function( neo )
    {
        return neo.getReferenceNode()._.single( "ROOT" ) instanceof Neo4js.Node;
    } );
}

function relationshipInstanceTypeIsRelationship()
{
    return service.transaction( function( neo )
    {
        return neo.getReferenceNode()._.single( "ROOT" ) instanceof Neo4js.Relationship;
    } );
}

function printNeoFriends()
{
    return service.transaction( function( neo )
    {
        var neoNode = neo.getReferenceNode()._.single( "ROOT" ).getEndNode();
        return printFriends( neoNode );
    } );
}

function printFriends( person )
{
    out.println( person.$.name() + "'s friends:" );
    var trav = person.traverse().outgoing( "KNOWS" ).returnAllButStartNode()
            .untilEndOfGraph();
    var count = 0;
    for ( let[friend, position] in Iterator( trav ) )
    {
        out.println( "At depth " + position.depth + " => "
            + friend.$.name() );
        ++count;
    }
    return count;
}

function printMatrixHackers()
{
    return service.transaction( function( neo )
    {
        var neoNode = neo.getReferenceNode()._.single( "ROOT" ).getEndNode();
        return findHackers( neoNode );
    } );
}

function findHackers( startNode )
{
    out.println( "Hackers:" );
    var trav = startNode.traverse().outgoing( "KNOWS", "CODED_BY" )
            .untilEndOfGraph();
    trav = trav.returnNode( function( node, position )
    {
        var rel = position.lastRelationshipTraversed();
        return rel != null && rel.isType( "CODED_BY" );
    } );
    var hackerName;
    for ( let[hacker, position] in Iterator( trav ) )
    {
        hackerName = hacker.$.name();
        out.println( "At depth " + position.depth + " => "
            + hackerName );
    }
    return hackerName;
}
